import isNumeric from './validate-number';


function makeJenksArray(data, years) {
    let jenksArray = [];
    for (let i in data) {
        for (let y = 0; y < years.length; y++) {

            if (isNumeric(data[i][`y_${years[y]}`])) {
                jenksArray.push(data[i][`y_${years[y]}`]);
            }
        }
    }
    return jenksArray;
}

export default makeJenksArray;
