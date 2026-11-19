# AI Middle Powers Explorer (draft)

BASE Fellowship project on middle powers and international AI governance.
This is an interactive map and database that classifies countries as major powers, strong or weak middle powers, or below threshold, using a 5-dimension, 20-criterion framework.

> **All country scores in `js/data.js` are placeholder judgements (0–3) for testing the framework. They are not verified data.**

## Run it

The app is plain HTML, CSS and JavaScript. There's no build step.

- **Quickest:** double-click `index.html` to open it in a browser.
- **Better (auto-reload):** in VS Code, install the **Live Server** extension, right-click `index.html` and choose **Open with Live Server**.

It needs an internet connection to load d3, topojson and Google Fonts from their CDNs.

## Project structure

```
index.html          Page layout: header, tabs, settings panel
css/styles.css      All styling
js/data.js          Framework, country scores, definition and findings (edit this most)
js/app.js           Scoring logic, map, country cards, table, candidates, settings
data/world-110m.js  World map boundaries (don't edit)
```

## Editing the data (`js/data.js`)

- **`DIMENSIONS`**: the 5 dimensions and their criteria. Each criterion has an `id`, a `name`, a `ref` (its intended data source), and optionally `proposed: true` (switched off by default).
- **`COUNTRIES`**: one entry per country. `name` must match the map's country name. `s` holds scores per dimension, in the same order as that dimension's criteria. Small states that don't appear on the map need a `marker: [longitude, latitude]`.
- **`DEFINITION`** and **`FINDINGS`**: the text shown on the page.

## How scoring works (`compute()` in `js/app.js`)

1. Each criterion is scored 0–3.
2. Dimension score = average of the included criteria ÷ 3 × 100.
3. Overall score = weighted average of the 5 dimension scores (equal weights by default).
4. Tier cut-offs (default): major power 85 and above, strong middle 55–84, weak middle 30–54, below threshold under 30.

Weights and cut-offs can be changed in the page's **Scoring settings** panel. The defaults live in `DEFAULTS` in `js/app.js`.

Note: weights are equal per *dimension*, so criteria in smaller dimensions carry more weight (e.g. each Security criterion is about 6.7% of the total, each Compute criterion 4%).
