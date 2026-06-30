# Matchsticks — Architecture

Status: draft | Last updated: 2026-06-29

---

## 1. Tech Stack Rationale

**Renderer: Three.js (vanilla, no React)**

- The game ships as a static bundle to GitHub Pages. React + React Three Fiber would add ~150KB gzipped for no runtime benefit.
- Three.js alone gives us scenes, cameras, geometries, and a render loop we fully control.
- The only dependency we carry is `three` + `vite`. Build output stays under ~500KB.

**Build: Vite**

- Dev server with HMR, production build with Rollup, zero config for our case.
- `vite.config.js` sets `base: "/matchsticks/"` for GH Pages repo-name hosting.
- Output directory is `dist/`.

**Hosting: GitHub Pages**

- Free, versioned, tied to the repo.
- We deploy via a GitHub Action that runs `npm run build` and pushes `dist/` to the `gh-pages` branch.

**Backend: Cloudflare Worker + Workers KV**

- The leaderboard needs persistent storage and a secret for HMAC signing.
- A Worker running at a custom subdomain (e.g. `matchsticks-api.example.workers.dev`) exposes two endpoints.
- KV is the backing store. Free tier: 100K reads/day, 1K writes/day — more than enough.

---

## 2. Directory Layout

```
matchsticks/
  src/
    game/        # core loop
      player.js
      hazards.js
      world.js
      score.js
    render/      # three.js scene
      scene.js
      matchstick.js   # character factory
      effects.js
    net/
      leaderboard.js  # fetch wrapper
    ui/
      hud.js
      menus.js
    main.js
  public/        # static assets (sounds, fonts)
  worker/        # cloudflare worker (separate wrangler.toml)
    src/index.js
    wrangler.toml
  index.html
  vite.config.js
  package.json
```

**Boundaries**

- `src/game/` owns state and rules. It does not import from `render/`.
- `src/render/` owns the scene graph. It reads state from `game/` each frame and updates meshes.
- `src/ui/` owns DOM overlays (HUD, menus). It is invisible to Three.js.
- `src/net/` owns all outbound fetch calls. No other module touches `fetch`.
- `worker/` is a standalone deployable. It does not share code with `src/`.

---

## 3. Player Controller Spec

**Inputs**

- Player 1: WASD for movement, Space for jump.
- Player 2: Arrow keys for movement, Enter for jump.

**Movement model**

- Velocity-based with horizontal acceleration and friction.
- Max run speed is capped. Acceleration is applied while a directional key is held. Friction decelerates to zero when no key is held.
- Jump is an instantaneous vertical impulse. Gravity pulls the character down every frame.
- Both players are affected by the same gravity constant and the same world scroll velocity.

**Shared state**

- One `GameState` object holds both player structs and the shared life pool.
- Life pool starts at 3. Any hazard collision decrements it. At 0, both players lose simultaneously.
- The HUD module reads from this single object. No player-local health exists.

---

## 4. Game Loop Spec

**Timestep**

- Fixed 60Hz (16.67ms per tick).
- `requestAnimationFrame` drives the render loop, but physics and game logic run on accumulated fixed steps.
- Maximum of 3 steps per frame to avoid spiral-of-death after tab-switch lag.

**Camera**

- Side-scrolling orthographic or perspective camera follows the midpoint of the two players.
- A dead zone prevents micro-jitter: the camera only moves when the midpoint exceeds a padding distance from the current center.

**World scroll**

- The world moves left at a base speed that increases over time.
- Speed curve: start at `BASE_SCROLL`, add `SCROLL_ACCEL * elapsed_seconds`, cap at `MAX_SCROLL`.
- Hazards and pickups spawn ahead of the camera and despawn when they leave the left edge.

---

## 5. Hazard System

**Spawner**

- Runs every frame. Spawn probability is a function of elapsed time and current scroll speed.
- When a spawn triggers, a weighted random pick selects the hazard type.

**Types**

1. Flame jet — vertical burst from the ground or ceiling, short duration, collision zone is a bounding box.
2. Ember shower — particles fall from above. Individual embers are small circles. Density increases with time.
3. Sweeping torch — a torch arm swings across the play area in an arc. Collision is a rotating line segment.
4. Bottomless pit — a floor gap. Falling in costs one life and respawns both players at the nearest safe ground.

**RNG**

- A seedable PRNG (xorshift or mulberry32) drives all random decisions.
- The seed is `Date.now()` at session start. This allows deterministic replay if we later log seeds server-side.

---

## 6. Score System

**Components**

- Distance: `scroll_speed * dt` accumulated continuously.
- Pickup bonuses: static values for each collectible type.
- Survival time multiplier: a multiplier that increases every 10 seconds of survival, applied to the final score on death.

**Formula**

```
score = (distance + bonus_sum) * (1 + survival_time / 60)
```

- Example: 1000 distance + 200 bonuses, 120s survival => `(1200) * (1 + 2) = 3600`.

**Server-side HMAC verification (Phase 2)**

- On game over, the client sends `{username, score, ts, signature}`.
- `signature = HMAC-SHA256(shared_secret, username + score + ts)`.
- The Worker verifies the HMAC before writing to KV. The shared secret is a Workers secret (`wrangler secret put HMAC_SECRET`).
- We do not implement the HMAC generator in the client yet. Phase 2 defines the contract.

---

## 7. Leaderboard API Contract

**Base URL**

- `https://matchsticks-api.example.workers.dev` (replace with actual subdomain).

**POST /score**

- Request body: `{username: string, score: number, signature: string}`
- Response: `{rank: number, top10: Array<{username, score, ts}>}`
- Behavior: validates HMAC, rate limit, score plausibility, then writes to KV. Returns the user's rank and the current top 10.

**GET /top**

- Query: `?limit=10` (default 10, max 50)
- Response: `[{username: string, score: number, ts: ISO8601}]` sorted descending by score.

**Rate limit**

- 5 submissions per `username` per minute.
- Implemented in the Worker using a KV key `rate:{username}` with a 60-second TTL.
- Exceeding the limit returns HTTP 429.

---

## 8. Anti-Cheat Notes

The Worker validates every submission in this order:

1. **Timestamp freshness** — `ts` must be within 60 seconds of server time. Reject stale or future timestamps.
2. **HMAC signature** — must match `HMAC-SHA256(secret, username + score + ts)`. Reject mismatches.
3. **Plausible max score** — cap at ~1000 points per second of elapsed time. A submission claiming 1M points after 10 seconds is impossible and is rejected with HTTP 400.
4. **Rate limit** — 5 per username per minute, as defined in section 7.

**Client-side**

- The game runs fully in the browser. Client-side code is untrusted by definition.
- All enforcement lives server-side. The client only collects and submits.

---

## 9. Build / Deploy

**Local development**

```bash
npm run dev      # vite dev server on localhost:5173
npm run build    # vite build → dist/
```

**Production**

- A GitHub Action workflow (`.github/workflows/deploy.yml`) triggers on push to `main`.
- Steps: checkout, `npm ci`, `npm run build`, push `dist/` to the `gh-pages` branch.
- GitHub Pages serves from the `gh-pages` branch.

**Worker**

- Deployed separately with `wrangler deploy` from the `worker/` directory.
- Not part of the Vite build. The Worker is a standalone deployable.

---

## 10. Phase Boundaries

**Phase 1 — MVP (Core Game Loop)**

- Vite + Three.js scaffold.
- Two matchstick characters with distinct colors.
- WASD / Arrow key controls, shared life pool.
- Side-scrolling camera, parallax background.
- Procedural hazards (flame jet, ember shower, sweeping torch, pit).
- Distance scoring, local high score in `localStorage`.
- Funny juice: squash-and-stretch animations, particle reactions, character quips on damage.

**Phase 2 — Leaderboard**

- Cloudflare Worker with KV backend.
- HMAC-signed score submission.
- Rate limiting, anti-cheat validation.
- Username prompt and top-10 display on game over screen.
- GitHub Pages + Worker live.

**Phase 3 — Payments + Polish**

- DodoPayments integration.
- Server-side receipt verification in the Worker.
- Ad-free badge for paying users (stored in KV, checked on score submission).
- Additional juice, sound effects, difficulty ramp tuning.

**Rule:** No Phase 2 or Phase 3 code is written during Phase 1. The scaffold may include empty stubs (e.g. `leaderboard.js` exporting no-ops) but must not depend on live backend services to run.

---

## Glossary

- Juice: visual and audio feedback that makes actions feel satisfying (screenshake, particles, squash-and-stretch).
- PRNG: pseudorandom number generator.
- HMAC: hash-based message authentication code.
