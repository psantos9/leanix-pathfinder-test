leanix-pathfinder-test
========================

A javascript end-to-end test suite for profiling LeanIX Pathfinder loading times.

Requirements
------------

leanix-pathfinder-test requires the following to run:

  * [Node.js][node] v18.4.0+
  * [npm][npm] (normally comes with Node.js)

## Installation

```bash
git clone git@github.com:psantos9/leanix-pathfinder-test.git
cd leanix-pathfinder-test
npm install
```

## Usage
1. Add a ".env" file to the project root folder with the following content:

        LEANIX_HOST=your workspace host here, e.g. us.leanix.net
        LEANIX_APITOKEN=your api token here

2. Run the following command:

        npm run test


3. Each test run will generate 10 automated sign in / sign out cycles that will be recorded indidividually and saved as a Http archive (HAR) file. These HAR files are stored inside the ```.output``` folder.

4. Compress the contents of the ```.output``` folder into a zip file and send it to your LeanIX CSE for further analysis.

[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/