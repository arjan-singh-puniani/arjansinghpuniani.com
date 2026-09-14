# Long-horizon QA — v16

The harness executes the real Game director and fixed-step character/tennis simulation at 30 Hz. A simulated club-day is 1,440 simulation seconds. This is accelerated CPU testing, not 100 days of wall-clock browser observation.

## Continuous ordinary play

| Club days | Completed activities | Interruptions | Personal memories | Events | Serialized mind bytes |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 | 29 | 0 | 38 | 1 | 13510 |
| 7 | 194 | 0 | 48 | 7 | 19424 |
| 30 | 815 | 0 | 50 | 30 | 29503 |
| 100 | 2737 | 0 | 49 | 48 | 34379 |

The final ordinary run recorded no invalid positions or paths above the 100-waypoint guard. It completed 39 three-person reflections across the two eligible hosts. All six two-person relationships appeared. At day 100, culture values were still differentiated and below their ceilings, rather than permanently saturated. Source: qa/v16-long-horizon.json.

An earlier candidate had five travel interruptions in this same long test; those led to the seat-exchange correction. The final ordinary run has zero. The earlier failures are retained in qa/v16-pre-swap-failures.json as audit history.

## Randomized timing and denser furniture

The seeded harness places a bench, plant, basket and lamp, varies weather, and requests actual lessons at random times. The fixture assigns furniture directly for reproducibility, so it is also an adversarial layout test rather than proof every arrangement can be built through the UI. It checks finite positions, bounded routes, unique retained activity IDs/receipts and no progress awarded merely on requesting a lesson.

| Seed | Days | Lesson requests | Completions | Travel interruptions | Maximum path length | Smallest sampled pedestrian center distance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 160913 | 20 | 62 | 708 | 5 | 11 | 0.82015 |
| 17 | 20 | 62 | 727 | 0 | 11 | 0.82001 |
| 923 | 20 | 61 | 716 | 1 | 10 | 0.82035 |

These are three different 20-day input sequences, not one 60-day run. Two seeds still produced rare 65-second travel timeouts. They are genuine residual route failures, not intentional request cancellations; per-event records distinguish this. No completion reward is granted to those interrupted activities. They remain a release blocker for a universal movement-quality claim.

Distance is sampled once per simulation second and excludes active tennis. It measures character centers, not full animated-body mesh collisions. Passing this guard does not prove every hand, racket or garment is collision-free.

## Retention and responsiveness stress

The separate 1,000-major-memory test verifies the hard major/foundational bounds and preservation of a foundational result; ordinary repetition tests verify compression. Culture is advanced across 100 days and then given a different completed-behavior pattern to verify it can still respond. The original favorite-place tests require actual repeated positive visits and preserve identity through moving/reloading.

## Reproduce

```sh
npm test
node qa/long-horizon.mjs
node qa/randomized-life.mjs
node qa/randomized-life.mjs 17
node qa/randomized-life.mjs 923
```

Real-time browser observations and performance limits are reported separately in QA.md. Neither simulation variety nor memory counts constitute human attachment evidence.
