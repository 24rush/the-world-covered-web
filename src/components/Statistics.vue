<script setup lang="ts">
import { reactive } from 'vue';
import strava from '@/icons/strava.vue';
import { HistoryStatistics } from '@/data_types/statistics';

const props = defineProps({
    statistics: {
        type: HistoryStatistics,
    },
});

const chartOptions = reactive({
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
    yaxis: [{
        title: {
            text: 'Average speed (km/h)',
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
    }],
    legend: {
        show: false
    }
});

function time_formatter(time_sec: number): String {
    if (time_sec >= 3600)
        return new Date(time_sec * 1000).toISOString().substring(11, 19) + "s"
    else
        return new Date(time_sec * 1000).toISOString().substring(14, 19) + "s"
}

function hours_per_week_formatter(value: number): string {
    if (value < 60)
        return Math.ceil(value).toString();
    else {
        return (Math.floor(value / 60)).toString() + "h" + Math.floor((value % 60)).toString() + "m";
    }
}

function hours_per_week_label_formatter(value: number): string {
    if (value < 60)
        return "min/week"
    else {
        return "hours/week"
    }
}

</script>

<template>
    <div v-if="statistics && statistics.stats.length" class="statistics">
        <ul class="nav nav-pills mb-3" id="pills-tab" role="tablist">
            <li class="nav-item" role="presentation" style="margin-bottom: 0.5em;">
                <button class="btn btn-primary buttons-bar-btn rounded-pill" id="pills-home-tab" data-bs-toggle="pill"
                    data-bs-target="#pills-home" type="button" role="tab" aria-controls="pills-home" tabindex="-1"
                    aria-selected="false">All</button>
            </li>
            <li v-for="(yearStats, index) in statistics.stats" class="nav-item" role="presentation">
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
                        <div style="display: flex; flex-direction: row; flex-wrap: wrap; width: 80%;">
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.reduce((prev, curr) => prev + curr.total_km_rides, 0))
                                }}</span>
                                <span class="total_item">KM</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.reduce((prev, curr) => prev + (curr.mins_per_week_rides * 52
                                        / 60), 0)) }}</span>
                                <span class="total_item">HOURS</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.reduce((prev, curr) => prev + (curr.calories_rides), 0))
                                }}</span>
                                <span class="total_item">calories</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.reduce((prev, curr) => prev + (curr.total_elevation_gain),
                                        0)) }}</span>
                                <span class="total_item">elevation meters</span>
                            </div>                            
                        </div>
                        <div class="apex-chart">
                            <span class="chart_header"><span style="color: #008FFB">KM</span> + <span
                                    style="color: #00E396">Average speed</span> + <span style="color: rgb(243 96 121);">
                                    companions</span></span>
                            <apexchart :options="chartOptions" height="200" :series="[
                                { name: 'avg', type: 'line', data: statistics.stats.map(year => [year.year, (3.6 * year.avg_speed_rides).toFixed(1)]) },
                                { name: 'KM', type: 'area', data: statistics.stats.map(year => [year.year, Math.ceil(year.total_km_rides)]) },
                                { name: 'rides with friends', type: 'bar', data: statistics.stats.map(year => [year.year, Math.ceil(year.rides_with_friends)]) },
                            ]">
                            </apexchart>
                        </div>
                    </div>
                    <div class="tab-pane fade" id="pills-run" role="tabpanel" aria-labelledby="pills-run-tab" tabindex="0">
                        <div style="display: flex; flex-direction: row; flex-wrap: wrap; width: 80%;">
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.reduce((prev, curr) => prev + curr.total_km_runs, 0))
                                }}</span>
                                <span class="total_item">KM</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.reduce((prev, curr) => prev + (curr.mins_per_week_runs * 52
                                        / 60), 0)) }}</span>
                                <span class="total_item">HOURS</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.reduce((prev, curr) => prev + (curr.calories_runs), 0))
                                }}</span>
                                <span class="total_item">calories</span>
                            </div>
                            <div class="stat_item">
                                <span class="total_item_value">{{
                                    Math.ceil(statistics.stats.reduce((prev, curr) => prev + (curr.calories_runs), 0) /
                                        statistics.stats.reduce((prev, curr) => prev + (curr.mins_per_week_runs * 52/60), 0)) }}</span>
                                <span class="total_item">calories/hour</span>
                            </div>
                        </div>
                        <div class="apex-chart">
                            <span class="chart_header"><span style="color: #008FFB">KM</span> + <span
                                    style="color: #00E396">Average speed</span></span>
                            <apexchart :options="chartOptions" height="200"
                                :series="[
                                    { name: 'avg', type: 'line', data: statistics.stats.map(year => [year.year, (3.6 * year.avg_speed_runs).toFixed(1)]) },
                                    { name: 'KM', type: 'area', data: statistics.stats.map(year => [year.year, Math.ceil(year.total_km_runs)]) }]">
                            </apexchart>

                        </div>
                    </div>
                </div>

            </div>
            <div v-for="(yearStats, index) in statistics.stats" class="tab-pane fade" style="width: 80%;"
                v-bind:class="{ 'show active': index == 0 }" v-bind:id="'pills-profile' + index.toString()" role="tabpanel"
                v-bind:aria-labelledby="'pills-profile-tab' + index.toString()" v-bind:tabindex='index.toString()'>
                <div style="display: flex; flex-wrap: wrap;">
                    <div class="stat_item">
                        <span class="total_item_value">{{
                            yearStats.rides }}</span>
                        <span class="total_item">Rides</span>
                    </div>
                    <div class="stat_item">
                        <span class="total_item_value">{{
                            yearStats.runs }}</span>
                        <span class="total_item">Runs</span>
                    </div>
                    <div class="stat_item">
                        <span class="total_item_value">{{
                            Math.ceil(yearStats.total_km_rides) }}</span>
                        <span class="total_item">KM</span>
                    </div>
                    <div class="stat_item">
                        <span class="total_item_value">{{
                            Math.ceil(yearStats.total_km_runs) }}</span>
                        <span class="total_item">KM</span>
                    </div>
                    <div class="stat_item">
                        <span class="total_item_value">{{ hours_per_week_formatter(
                            yearStats.mins_per_week_rides) }}</span>
                        <span class="total_item">Hours/week</span>
                    </div>

                    <div class="stat_item">
                        <span class="total_item_value">{{ hours_per_week_formatter(
                            yearStats.mins_per_week_runs) }}</span>
                        <span class="total_item">{{ hours_per_week_label_formatter(yearStats.mins_per_week_runs) }}</span>
                    </div>
                    <div class="stat_item">
                        <span class="total_item_value">{{
                            Math.ceil(yearStats.total_elevation_gain) }}m</span>
                        <span class="total_item">Elevation gain</span>
                    </div>


                    <div class="stat_item">
                        <div>
                            <span class="total_item_value">{{
                                yearStats.total_kudos
                            }} </span>
                            <span style="padding-left: 5px;">most in</span>
                            <a class="strava_logo"
                                v-bind:href="`https://www.strava.com/activities/${yearStats.most_kudos_activity}`"
                                target="_blank">
                                <strava />
                            </a>
                        </div>
                        <span class="total_item">Kudoses</span>
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
}</style>