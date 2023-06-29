<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { Formatters } from './formatters';

var is_chartable_data = ref(false);
var is_table_data = ref(false);

var chart_series = ref<any>({});
var table_data = ref<string[]>([]);

const props = defineProps({
    results_data: {
        type: Object,
        required: true
    }
});

const chartOptions = reactive({
    chart: {
        toolbar: {
            show: false
        },
        sparkline: {
            enabled: false
        }
    },
    fill: {
        opacity: [0.85, 0.25, 1],
        gradient: {
            inverseColors: false,
            shade: 'light',
            type: "vertical",
            opacityFrom: 0.85,
            opacityTo: 0.55,
            stops: [0, 100, 100, 100]
        }
    },
    plotOptions: {
        bar: {
            columnWidth: "20%",
            borderRadius: 5,
        }
    },
    stroke: {
        width: [0.3, 0, 0.6],
        curve: 'smooth'
    },
    xaxis: {
        type: "string",
        title: {
            text: "X Axis"
        }
    },
    animations: {
        enabled: true,
    },
    colors: ['#00E396', '#008FFB', '#FFAEBC'],
    yaxis: [{
        title: {
            text: 'Y Axis',
        },
        type: 'string',
    }],
    legend: {
        show: true
    }
});

function format_field(key: string, value: number): [string, string | number] {
    switch (key) {
        case "avg_speed":
        case "average_speed":
            return ["Average speed", Formatters.speed_formatter(value)];
        case "elapsed_time":
            return ["Elapsed time", Formatters.time_formatter(value)];
        default:
            return [key, value];
    }
}

onMounted(() => {
    // Returned data to display
    //console.log(props.results_data)

    if (props.results_data.length && props.results_data.length > 0) {
        // { id: {year:2011}, total: 5444}
        // id, total
        let result_object_keys = Object.keys(props.results_data[0]);

        if (props.results_data.length <= 1) {
            is_table_data.value = true;

            for (let result_data of Object.values(props.results_data)) {
                for (let key of result_object_keys) {
                    let result_object_value = result_data[key];

                    if (result_object_value) {
                        let formatted_fields = format_field(key, result_object_value); 
                        table_data.value.push(formatted_fields[0].toString() + ": " + formatted_fields[1].toString());
                    }
                }
            }
        } else
            if (result_object_keys.length >= 2) {
                is_chartable_data.value = true;

                let key_name_and_data = (key: any): [string, any] => {
                    if (key != null && typeof key === "object") {
                        let key_name = Object.keys(key)[0];

                        if (typeof key[key_name] === 'object') {
                            return key_name_and_data(key[key_name]);
                        }
                        else
                            return [key_name, key[key_name]];
                    }

                    return ["", key];
                };

                let time_keys = ['month', 'year'];
                let time_key = "";
                let rest_keys: string[] = [];
                let result_vectors: Record<string, string[]> = {};

                for (let result_data of Object.values(props.results_data)) {
                    for (let key of result_object_keys) {
                        let result_object_value = result_data[key];
                        let key_name_data = key_name_and_data(result_object_value);

                        let actual_key = key_name_data[0] == "" ? key : key_name_data[0];
                        let actual_value = format_field(actual_key, key_name_data[1]);

                        if (!actual_value)
                            continue;

                        if (!(actual_key in result_vectors))
                            result_vectors[actual_key] = [];

                        result_vectors[actual_key].push(actual_value.toString());

                        if (time_keys.includes(actual_key)) {
                            if (time_key == "") time_key = actual_key;
                        } else rest_keys.push(actual_key);
                    }
                }

                if (time_key == "") {
                    time_key = rest_keys[0];
                    rest_keys.shift();
                }

                let data: [string | number, string][] = [];

                result_vectors[time_key].forEach((val, index) => {
                    let valY = result_vectors[rest_keys[0]][index];

                    let tryFloat = parseFloat(valY);
                    if (!Number.isNaN(tryFloat)) {
                        valY = tryFloat.toFixed(0);
                    }

                    if (val.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)) {
                        // Checks if it is dateformat
                        chartOptions.xaxis.type = "datetime";
                        data.push([val, valY.toString()]);
                    } else {
                        let tryFloat = parseFloat(val);

                        // Check if numeric so we can display it directly of make categories
                        if (Number.isNaN(tryFloat)) {
                            //@ts-ignore
                            if (!chartOptions.xaxis.categories)
                                //@ts-ignore
                                chartOptions.xaxis.categories = [];
                            //@ts-ignore
                            chartOptions.xaxis.categories.push(val);

                            data.push([index, valY.toString()]);
                        } else {
                            data.push([parseFloat(val), valY.toString()]);
                        }
                    }
                });

                if (chartOptions.yaxis[0].title)
                    chartOptions.yaxis[0].title.text = rest_keys[0];

                if (chartOptions.xaxis.title)
                    chartOptions.xaxis.title.text = time_key

                chart_series = [
                    {
                        name: result_object_keys[0] == "_id" ? "value" : result_object_keys[0], type: 'bar', data: data
                    }
                ];
            }
    }
});

</script>

<template>
    <div v-if="is_chartable_data" class="gpt_chart">
        <apexchart :options="chartOptions" height="200" :series="chart_series">
        </apexchart>
    </div>

    <div v-if="is_table_data" class="table_data">
        <ul class="list-group list-group-flush">
            <li v-for="entry of table_data" class="list-group-item">{{ entry }}</li>
        </ul>
    </div>
</template>

<style>
.table_data {
    width: 100%;
    margin: auto;
    background-color: white;
    border-radius: 50px;
    padding: 30px;
    max-height: 500px;
    overflow-y: auto;
}

.gpt_chart {
    width: 100%;
    margin: auto;
    background-color: white;
    border-radius: 50px;
    padding-right: 30px;
    padding-top: 20px;
}

.stat_item_title {
    width: 50%;
    text-align: end;
}

.stat_item {
    width: 50%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-bottom: 0.8em;
}

.total_item {
    font-size: 15px;
    text-transform: uppercase;
    text-align: end;
}

.total_item_value {
    font-size: 30px;
    font-weight: 500;
    line-height: 1;
}

.apex-chart {
    width: 100% !important;
}

.chart_header {
    font-size: 18px;
    text-transform: uppercase;
}
</style>