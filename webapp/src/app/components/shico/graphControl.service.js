(function() {
  'use strict';

  angular
      .module('shico')
      .service('GraphControlService', GraphControlService);

  function GraphControlService(GraphConfigService) {
    var vm = this;

    vm.streamGraph = {
      options: GraphConfigService.getConfig('streamGraph'),
      data:    []
    };

    vm.forceGraph = {
      options: GraphConfigService.getConfig('forceGraph'),
      data: [],
      currYearIdx: 0
    };

    vm.scatterGraph = {
      options: GraphConfigService.getConfig('scatterGraph'),
      data: []
    };

    vm.vocabularies = {
      plainText: ''
    };

    vm.yearLabels = [];
    vm.slider_options = {
      floor: 0,
      ceil: 0,
      showTicksValues: false,
      translate: getYearLabel
    };

    var service = {
      update: update,
      getRawData: getRawData,
      getYearLabel: getYearLabel,
      streamGraph: vm.streamGraph,
      forceGraph:  vm.forceGraph,
      scatterGraph: vm.scatterGraph,
      vocabularies: vm.vocabularies,
      slider_options: vm.slider_options
    };
    return service;

    function getYearLabel(yearIdx) {
      return vm.yearLabels[yearIdx];
    }

    // Update graphs with the given data
    function update(data) {
      // Keep raw data for further processing if required
      vm.rawData = data;

      // Collect all words and year labels on data
      var allYears = [];
      var allWords = new Set();
      angular.forEach(data.stream, function(wordValues, year) {
        allYears.push(year);
        angular.forEach(wordValues, function(weight, word) {
          allWords.add(word);
        });
      });

      // Create year idx -> label table
      var yearIdx = {};
      angular.forEach(allYears, function(year, idx) {
        yearIdx[year] = idx;
      });

      // Register vocabulary and year labels with to be used by config
      GraphConfigService.setVocabulary(allWords);
      GraphConfigService.setStreamYears(allYears);
      vm.yearLabels = allYears;

      // Prepare data on format suitable from NVD3
      var streamData = formatForStream(data.stream, yearIdx, allWords, allYears);
      var forceData  = formatForForce(data.networks, yearIdx);
      var scatterData = formatForScatter(data.embedded, yearIdx);

      // Register data on graph
      vm.streamGraph.data = streamData;
      vm.forceGraph.data = forceData;
      vm.scatterGraph.data = scatterData;
      vm.vocabularies.plainText = 'We will need to send data from the server...';
      vm.vocabularies['1980'] = {
        'seed1': [ 'word1','word2','word3']
      };
      vm.vocabularies['1981'] = {
        'seed1': [ 'word1','word2','word3'],
        'seed2': [ 'word4','word5','word6']
      };

      vm.slider_options.ceil = vm.yearLabels.length-1;
    }

    function getRawData() {
      return vm.rawData;
    }

    function formatForStream(data, yearIdx, allWords, allYears) {
      var streamData = [];
      angular.forEach(allWords, function(word) {
        var values = [];
        angular.forEach(allYears, function(year) {
          var val = (word in data[year]) ? data[year][word] : 0;
          this.push([ yearIdx[year], val]);
        }, values);
        this.push({
          key: word,
          values: values
        });
      }, streamData);
      return streamData;
    }

    function formatForForce(data, yearIdx) {
      var forceData = {};

      angular.forEach(data, function(network, year) {
        forceData[yearIdx[year]] = network;
      });

      return forceData;
    }

    function formatForScatter(data, yearIdx) {
      var scatterData = {};

      angular.forEach(data, function(embedding, year) {
        var embedding2 = [
          {
            key   : 'Group0',
            values: embedding
          }
        ];
        scatterData[yearIdx[year]] = embedding2;
      });

      return scatterData;
    }
  }
})();
