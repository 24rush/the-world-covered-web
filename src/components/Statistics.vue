<script setup lang="ts">
import { reactive } from 'vue';
import { HistoryStatistics } from '@/data_types/statistics';
import { Formatters } from '@/components/formatters'

const props = defineProps({
    statistics: {
        type: HistoryStatistics,
    },
});

const baseChartOptions = {
    chart: {
        toolbar: {
            show: false
        },

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
        type: 'string',
    },
    animations: {
        enabled: false,
    },
    colors: ['#00E396', '#008FFB', '#FFAEBC'],
    legend: {
        show: false
    },
    yaxis: []
};

let one_yaxis = [{
    title: {
        text: 'VO2MAX (km/h)',
    }
}, {

    show: false
}];

let two_yaxis = [{
    title: {
        text: 'Average speed (mL/kg/min)',
    }
},
{
    title: {
        text: 'Distance',
    },
    opposite: true,
}, {
    type: 'string',
    show: false
}];

let oneYAxisOptions = { ...baseChartOptions };
oneYAxisOptions.yaxis = oneYAxisOptions.yaxis.concat(one_yaxis as any);
const oneYAxisChartOptions = reactive(oneYAxisOptions);

let twoYAxisOptions = { ...baseChartOptions };
twoYAxisOptions.yaxis = twoYAxisOptions.yaxis.concat(two_yaxis as any)
const twoYAxisChartOptions = reactive(twoYAxisOptions);

</script>

<template>
    <div v-if="statistics && statistics.stats.years_of_sports.length" class="statistics">
        <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
            <li class="nav-item" role="presentation" style="margin-bottom: 0.5em;">
                <button class="btn btn-light buttons-bar-btn rounded-pill" id="pills-home-tab" data-bs-toggle="pill"
                    data-bs-target="#pills-home" type="button" role="tab" aria-controls="pills-home" tabindex="-1"
                    aria-selected="false">All</button>
            </li>
            <li v-for="(yearStats, index) in statistics.stats.years_of_sports" class="nav-item" role="presentation">
                <button class="btn btn-light buttons-bar-btn rounded-pill" v-bind:class="{ 'active': index == 0 }"
                    v-bind:id="'pills-profile-tab' + index.toString()" data-bs-toggle="pill"
                    v-bind:data-bs-target="'#pills-profile' + index.toString()" type="button" role="tab"
                    v-bind:aria-controls="'pills-profile' + index.toString()" v-bind:aria-selected="index == 0">{{
                        yearStats.year
                    }}</button>
            </li>
        </ul>
        <div class="tab-content" id="pills-tabContent">
            <div class="tab-pane fade" id="pills-home" role="tabpanel" aria-labelledby="pills-home-tab" tabindex="-1">

                <ul class="nav nav-pills mb-3" id="pills-tab_types" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="btn btn-light buttons-bar-btn rounded-pill active" id="pills-ride-tab"
                            data-bs-toggle="pill" data-bs-target="#pills-ride" type="button" role="tab"
                            aria-controls="pills-ride" aria-selected="false">Ride</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="btn btn-light buttons-bar-btn rounded-pill" id="pills-run-tab" data-bs-toggle="pill"
                            data-bs-target="#pills-run" type="button" role="tab" aria-controls="pills-run"
                            aria-selected="true">Run</button>
                    </li>
                </ul>
                <div class="tab-content" id="pills-tabContent">
                    <div class="tab-pane fade show active" id="pills-ride" role="tabpanel" aria-labelledby="pills-ride-tab"
                        tabindex="0">
                        <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.years_of_sports.reduce((prev, curr) =>
                                        prev + curr.sports.filter(sport => sport.type == "Ride")[0].total_km, 0))
                                }}</span>
                                <span class="total_item">KM</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.years_of_sports.reduce((prev, curr) => prev +
                                        (curr.sports.filter(sport => sport.type == "Ride")[0].mins_per_week * 52
                                            / 60), 0)) }}</span>
                                <span class="total_item">HOURS</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.years_of_sports.reduce((prev, curr) => prev +
                                        (curr.sports.filter(sport => sport.type == "Ride")[0].calories), 0))
                                }}</span>
                                <span class="total_item">calories</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.years_of_sports.reduce((prev, curr) => prev +
                                        (curr.sports.filter(sport => sport.type == "Ride")[0].total_elevation_gain),
                                        0)) }}</span>
                                <span class="total_item">elevation meters</span>
                            </div>
                        </div>
                        <div class="apex-chart">
                            <span class="chart_header"><span style="color: #008FFB">KM</span> + <span
                                    style="color: #00E396">Average speed</span> + <span style="color: rgb(243 96 121);">
                                    companions</span></span>
                            <apexchart :options="twoYAxisChartOptions" height="200" :series="[
                                { name: 'avg', type: 'line', data: statistics.stats.years_of_sports.map(year => [year.year, (3.6 * year.sports.filter(sport => sport.type == 'Run')[0].avg_speed).toFixed(1)]) },
                                { name: 'KM', type: 'area', data: statistics.stats.years_of_sports.map(year => [year.year, Math.ceil(year.sports.filter(sport => sport.type == 'Run')[0].total_km)]) },
                                { name: 'rides with friends', type: 'bar', data: statistics.stats.years_of_sports.map(year => [year.year, Math.ceil(year.rides_with_friends)]) },
                            ]">
                            </apexchart>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="pills-run" role="tabpanel" aria-labelledby="pills-run-tab" tabindex="0">
                        <div style="display: flex; flex-direction: row; flex-wrap: wrap;">
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.years_of_sports.reduce((prev, curr) => prev +
                                        curr.sports.filter(sport => sport.type == "Run")[0].total_km, 0))
                                }}</span>
                                <span class="total_item">KM</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.years_of_sports.reduce((prev, curr) => prev +
                                        (curr.sports.filter(sport => sport.type == "Run")[0].mins_per_week * 52
                                            / 60), 0)) }}</span>
                                <span class="total_item">HOURS</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.years_of_sports.reduce((prev, curr) => prev +
                                        (curr.sports.filter(sport => sport.type == "Run")[0].calories), 0))
                                }}</span>
                                <span class="total_item">calories</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.years_of_sports.reduce((prev, curr) => prev +
                                        (curr.sports.filter(sport => sport.type == "Run")[0].calories), 0) /
                                        statistics.stats.years_of_sports.reduce((prev, curr) => prev + (curr.sports.filter(sport => sport.type == "Run")[0].mins_per_week
                                            * 52 / 60), 0))
                                }}</span>
                                <span class="total_item">calories/hour</span>
                            </div>
                        </div>
                        <div class="apex-chart">
                            <span class="chart_header"><span style="color: #008FFB">KM</span> + <span
                                    style="color: #00E396">Average speed</span></span>
                            <apexchart :options="twoYAxisChartOptions" height="200"
                                :series="[
                                    { name: 'avg', type: 'line', data: statistics.stats.years_of_sports.map(year => [year.year, (3.6 * year.sports.filter(sport => sport.type == 'Run')[0].avg_speed).toFixed(1)]) },
                                    { name: 'KM', type: 'area', data: statistics.stats.years_of_sports.map(year => [year.year, Math.ceil(year.sports.filter(sport => sport.type == 'Run')[0].total_km)]) }]">
                            </apexchart>
                        </div>
                        <div class="apex-chart">
                            <span class="chart_header"><span style="color: #00E396">VO<sub>2</sub>MAX</span></span>
                            <apexchart :options="oneYAxisChartOptions" height="200"
                                :series="[
                                    { name: 'vo2max_run', type: 'area', data: statistics.stats.years_of_sports.map(year => [year.year, year.vo2max_run.toFixed(1)]) }]">
                            </apexchart>
                        </div>
                    </div>
                </div>

            </div>
            <div v-for="(yearStats, index) in statistics.stats.years_of_sports" class="tab-pane fade" style="width: 80%;"
                v-bind:class="{ 'show active': index == 0 }" v-bind:id="'pills-profile' + index.toString()" role="tabpanel"
                v-bind:aria-labelledby="'pills-profile-tab' + index.toString()" v-bind:tabindex='index.toString()'>
                <div style="display: flex; flex-wrap: wrap;">
                    <div class="stat_item">
                        <span class="total_item_value">{{
                            yearStats.sports.filter(sport => sport.type == "Ride")[0].count }}</span>
                        <span class="total_item">Rides</span>
                    </div>
                    <div class="stat_item">
                        <span class="total_item_value">{{
                            yearStats.sports.filter(sport => sport.type == "Run")[0].count }}</span>
                        <span class="total_item">Runs</span>
                    </div>
                    <div class="stat_item">
                        <span class="total_item_value">{{
                            Math.ceil(yearStats.sports.filter(sport => sport.type == "Ride")[0].total_km) }}</span>
                        <span class="total_item">KM</span>
                    </div>
                    <div class="stat_item">
                        <span class="total_item_value">{{
                            Math.ceil(yearStats.sports.filter(sport => sport.type == "Run")[0].total_km) }}</span>
                        <span class="total_item">KM</span>
                    </div>
                    <div class="stat_item">
                        <span class="total_item_value">{{ Formatters.hours_per_week_formatter(
                            yearStats.sports.filter(sport => sport.type == "Ride")[0].mins_per_week) }}</span>
                        <span class="total_item">Hours/week</span>
                    </div>

                    <div class="stat_item">
                        <span class="total_item_value">{{ Formatters.hours_per_week_formatter(
                            yearStats.sports.filter(sport => sport.type == "Run")[0].mins_per_week) }}</span>
                        <span class="total_item">{{ Formatters.hours_per_week_label_formatter(yearStats.sports.filter(sport => sport.type == "Run")[0].mins_per_week)
                        }}</span>
                    </div>
                    <div class="stat_item">
                        <span class="total_item_value">{{
                            Math.ceil(yearStats.sports.filter(sport => sport.type == "Ride")[0].total_elevation_gain) }}m</span>
                        <span class="total_item">Elevation gain</span>
                    </div>


                    <div class="stat_item">
                        <div style="display: flex; flex-direction: column;text-align: end;">
                            <a v-bind:href="`https://www.strava.com/activities/${yearStats.best_12min_act_id}`"
                                target="_blank">
                                <span class="total_item_value">{{
                                    yearStats.vo2max_run.toFixed(1)
                                }} </span></a>
                        </div>
                        <span class="total_item">VO<sub>2</sub>max</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style>
.statistics {
    width: 100%;
    margin: auto;
    background-color: white;
    border-radius: 50px;
    padding: 30px;
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