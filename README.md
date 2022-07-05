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


3. Each test run will record loading times for 10 automated LeanIX EAM sign in cycles, perform latency test measurements for different Azure Availability Regions, and compute overall statistics. The test output will be saved as ```.output\test_result.zip```.

4. Send the ```.output\test_result.zip``` file to your LeanIX CSE for further analysis.

[node]: https://nodejs.org/
[npm]: https://www.npmjs.com/
