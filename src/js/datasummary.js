import {calcValue} from './metric_calculations';
import {prettyNumber} from './number_format';
import selectGroups from '../../data/config/selectgroups.json';

function dataSummary(appState) {
  let summary = {
    years: [],
    values: {}
  };

  summary.years = appState.metric.years;

  // Geography Groups
  let selectGroupKeys = Object.keys(selectGroups.Jurisdiction);
  for (let g = 0; g < selectGroupKeys.length; g++) {
    let groupArray = [];
    let keys = selectGroups.Jurisdiction[selectGroupKeys[g]];
    for (let i = 0; i < appState.metric.years.length; i++) {
      let groupVal = calcValue(
        appState.metric.data,
        appState.metric.config.type,
        appState.metric.years[i],
        keys
      );
      groupVal = prettyNumber(
        groupVal,
        appState.metric.config.decimals,
        appState.metric.config.prefix,
        appState.metric.config.suffix
      );
      groupArray.push(groupVal);
    }
    summary.values[selectGroupKeys[g]] = groupArray;
  }

  // County
  let areaArray = [];
  let keys = Object.keys(appState.metric.data.map);
  for (let i = 0; i < appState.metric.years.length; i++) {
    let areaValue;
    if (
      appState.metric.config.world_val &&
      appState.metric.config.world_val[`y_${appState.metric.years[i]}`]
    ) {
      areaValue =
        appState.metric.config.world_val[`y_${appState.metric.years[i]}`];
      areaValue = prettyNumber(
        areaValue,
        appState.metric.config.decimals,
        appState.metric.config.prefix,
        appState.metric.config.suffix
      );
    } else {
      areaValue = calcValue(
        appState.metric.data,
        appState.metric.config.type,
        appState.metric.years[i],
        keys
      );
      areaValue = prettyNumber(
        areaValue,
        appState.metric.config.decimals,
        appState.metric.config.prefix,
        appState.metric.config.suffix
      );
    }
    areaArray.push(areaValue);
  }
  summary.values.County = areaArray;

  // selected values
  if (appState.selected.length > 0) {
    let selectedArray = [];
    for (let i = 0; i < appState.metric.years.length; i++) {
      let selectedValue = calcValue(
        appState.metric.data,
        appState.metric.config.type,
        appState.metric.years[i],
        appState.selected
      );
      selectedValue = prettyNumber(
        selectedValue,
        appState.metric.config.decimals,
        appState.metric.config.prefix,
        appState.metric.config.suffix
      );
      selectedArray.push(selectedValue);
    }
    summary.values.Neighborhood = selectedArray;
  }

  return summary;
}

export default dataSummary;
