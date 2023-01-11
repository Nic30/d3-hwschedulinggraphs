## d3-hwschedulinggraphs
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/Nic30/d3-hwschedulinggraphs/tree/main.svg?style=svg)](https://dl.circleci.com/status-badge/redirect/gh/Nic30/d3-hwschedulinggraphs/tree/main)[![Coverage Status](https://coveralls.io/repos/github/Nic30/d3-wave/badge.svg?branch=master)](https://coveralls.io/github/Nic30/d3-wave?branch=master)

This project is the widget which displays timeline graph (Gantt graph, task scheduling graph).
Its primary purpose is a visualization of circuit scheduling in HLS engines.
Each task may have multiple ports where other taks dependencies are connected.
This widget also have many methods for highlighting and searching as they are required for orientation in larger graphs. 
 
Implemented in TypeScript using d3.js builded by Rollup.js.
Designed to work fast enough for ~10K nodes with 4-9 connections on each node at average.
Runs faster in Chrome than Firefox.

### Out of the box features

* zoom/pan
* dynamic x-axis for time
* onmouseover node detail
* stylable node, link from input json
* inverse highlight for mouse over, and select by click (inverse highlight means that selected thing has oppacity=1 while rest have oppacity<1 and thus it is darker)
* search/highlight from javascript console


![scroll_and_zoom.gif](doc/screen.png)

## Quickstart

Prerequsities for linux
* You may need to update nodejs PPA https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-20-04
  node > 14.0.0 is required in order to run tests with jest. 
```bash
sudo apt install nodejs 
```

To get started, install dependencies:

```bash
npm install
```

Build the Application

```bash
npm run build
```

Now you can open index.html (no html/webdev server required, but if you are developer consider it)


### Input data format

* JSON, see src/data.ts TimelineData class


Package structure based on:

* https://github.com/tomchen/example-typescript-package
* https://github.com/Lemoncode/d3js-typescript-examples