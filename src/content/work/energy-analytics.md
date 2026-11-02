---
title: Arsenal
tagline: An LLM-powered analytics platform for around 60,000 telco tower sites.
order: 1
domain: AI analytics, telco
problem: HQ and 12 regional teams had to dig through spreadsheets to understand electricity use and billing across around 60,000 tower sites.
role: Sole designer, from concept to pre-launch
team: Front-end and back-end engineers, 2 data scientists, a data engineer, QA and a PM
timeline: Oct 2025 – Oct 2026
outcome: Pre-launch. The HQ team has confirmed the design works. There are no usage metrics yet.
cover: /work/voltwise-anomalies.webp
coverAlt: Voltwise dashboard showing KPI cards, a ranked region list and a site map with anomalies highlighted
coverWidth: 2560
coverHeight: 1600
demo: true
gallery:
  - src: /work/voltwise-assistant.webp
    alt: Assistant panel answering a plain-language question beside the filtered dashboard
    caption: A plain-language question returns site cards and filters the dashboard behind the panel.
  - src: /work/voltwise-licenses.webp
    alt: Licenses view using the same cards, ranked regions, map and table as the anomalies view
    caption: The license view reuses the same anatomy as the anomaly view, so there is one thing to learn.
  - src: /work/voltwise-site.webp
    alt: Site detail panel with an AI explanation, a forecast chart and license and bill facts
    caption: Site detail leads with the explanation, then the evidence.
---

Arsenal forecasts electricity consumption and billing for Telkomsel's Network team. Its users are an HQ team of 10+ people and 12 regional PICs. I was the only designer on the product and worked with the team from the first concept through to pre-launch.

The screens below are from Voltwise, a working rebuild in code with a fictional brand and generated data. No real client data appears on this page.

## Turning a data problem into a reading problem

The underlying processing is complex: forecasts, metered usage, billing records and license records all meet at site level. Users do not need that complexity. They need to know which sites deserve attention and why. So the work was mostly about simplifying very complex data into visuals people can read quickly.

## KPI cards that double as filters

This is the signature pattern of the product. The KPI cards at the top of a view are also its main filter. Selecting one recolours the map, re-ranks the regions, rewrites the summary and narrows the table. A user reads a number and then acts on that same number, with no separate filter panel to learn.

## One anatomy for every use case

Energy anomalies, license validation and invoice monitoring are different problems with the same shape: a population of sites split into states, where someone has to find the ones that need action. I used one structure for all of them: status mix, filter cards, ranked regions, map, explanation, table.

## An AI layer that sits inside the work

The LLM does three jobs: natural-language query, AI-generated summaries and anomaly explanations. Users can ask a question from any page without leaving the data in front of them, and answers come back as structured site results rather than a wall of text. Summaries and explanations appear where the decision happens, so nobody has to go to a separate AI page to get value from it.

## Compliance views

Two views track license adherence per site and upcoming bill due dates. They were built to cut avoidable utility costs and late payments.

## Where it stands

The product is pre-launch, so I do not have adoption numbers to show. What I can say is that the HQ team has reviewed the design and confirmed it works for them.
