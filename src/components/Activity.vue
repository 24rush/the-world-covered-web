<script setup lang="ts">
import Activity from '@/data_types/activity';
import running from '@/icons/running.vue';
import cycling from '@/icons/cycling.vue';
import mountain from '@/icons/mountain.vue';
import strava from '@/icons/strava.vue';
import hiking from '@/icons/hiking.vue';
import gradient from '@/icons/gradient.vue';
import { reactive } from 'vue';

const emit = defineEmits(['segmentEffortsRequested'])

const props = defineProps({
    activity: {
        type: Activity,
        required: true
    },
    id : {
        type: Number,
        required: true
    },
    count_times: {
        type: Number,
        required: true
    },
});

const chartOptions = reactive({
    chart: {
        type: 'line',
        toolbar: {
            show: false
        }
    },
    xaxis: {
        type: 'string',
    },
    animations: {
        enabled: false,
    },
    dataLabels: {
        enabled: false,
    },
    yaxis: [{
        labels: {
            formatter: function (value: number) {
                return distance_formatter(value);
            }
        },
        title: {
            text: 'Distance from start',
        }
    }, {
        labels: {
            formatter: function (value: number) {
                return time_formatter(value);
            }
        },
        title: {
            text: 'Moving time',
        },
        opposite: true,

    }],
    legend: {
        show: false
    }
});

function distance_formatter(distance_m: number): String {
    if (distance_m > 1000)
        return Math.ceil(distance_m / 1000).toString() + "km"

    return distance_m.toString() + 'm';
}

function time_formatter(time_sec: number): String {
    if (time_sec >= 3600)
        return new Date(time_sec * 1000).toISOString().substring(11, 16) + "s"
    else
        return new Date(time_sec * 1000).toISOString().substring(14, 19) + "s"
}

function pace_formatter(m_per_sec: number): String {
    var pace = 16.667 / m_per_sec;
    var leftover = pace % 1;
    var minutes = pace - leftover;
    var seconds = Math.round(leftover * 60);

    return minutes + ":" + (seconds < 10 ? '0' + seconds : seconds)
}

function segmentEffortsRequested(activity: Activity, seg_id: number, effort_id: number) {
    let button = document.querySelector('[data-bs-target="#collapse' + effort_id + '"]') as HTMLElement;

    if (button && "true" === button.getAttribute('aria-expanded')) {
        emit('segmentEffortsRequested', activity, seg_id);
    }
}

</script>

<template>
    <div style="width: 100%;">
        <div class="d-flex">
            <div>
                <span class="fw-bold" v-if="activity.location_city">{{ activity.location_city
                }}, </span>
                <span class="fw-bold">{{ activity.location_country }}</span>
                <div>
                    <span class="stats-item">{{ Math.ceil(activity.distance / 1000) }}km</span>
                    <span class="stats-item">
                        <mountain style="height: 17px;" />
                    </span>
                    <span class="stats-item">{{ Math.ceil(activity.total_elevation_gain) }}m </span>
                    <span class="stats-item" v-if="activity.type === 'Ride'">{{ parseFloat((activity.average_speed *
                        3.6).toString()).toFixed(1) }}km/h</span>
                    <span class="stats-item" v-if="activity.type === 'Hike' || activity.type === 'Run'">{{
                        pace_formatter(activity.average_speed) }}min/km</span>
                </div>
            </div>
            <div class="ml-auto">               
                <span class="badge-item"><a class="strava_logo"                        
                        v-bind:href="`https://www.strava.com/activities/${id}`" target="_blank">
                        <strava />
                    </a></span>
                <span class="badge-item" style="vertical-align: top;">
                    <running v-if="activity.type === 'Run'" />
                    <cycling v-if="activity.type === 'Ride'" />
                    <hiking v-if="activity.type === 'Hike'" />
                </span>
                <span v-if="activity.athlete_count > 1 && count_times == 1" class="badge bg-primary rounded-pill">{{
                    activity.athlete_count
                }} people</span>
                <span v-if="count_times > 1" class="badge bg-primary rounded-pill">{{ count_times }} times</span>
            </div>
        </div>

        <div class="d-flex accordion accordion-flush pt-1">
            <div class="accordion-item" style="width: 100%;">
                <span class="accordion-header" v-bind:id="'header' + activity._id.toString()">
                    <button v-if="activity.segment_efforts" class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                        :data-bs-target="'#collapse' + activity._id.toString()" aria-expanded="true"
                        v-bind:aria-controls="'collapse' + activity._id.toString()">
                        Segments {{ activity.segment_efforts.length }}
                    </button>
                </span>
                <div v-bind:id="'collapse' + activity._id.toString()" class="accordion-collapse hide collapse"
                    v-bind:aria-labelledby="'header' + activity._id.toString()">
                    <div v-for="effort in activity.segment_efforts" class="accordion-body">

                        <div class="d-flex accordion accordion-flush pt-1">
                            <div class="accordion-item" style="width: 100%;"
                                v-on:click="segmentEffortsRequested(activity, effort.segment.id, effort.id)">
                                <span class="accordion-header" v-bind:id="'header' + effort.id.toString()">
                                    <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                        :data-bs-target="'#collapse' + effort.id.toString()" aria-expanded="true"
                                        v-bind:aria-controls="'collapse' + effort.id.toString()">
                                        <div>
                                            <span>{{ effort.name }}</span>
                                            <div class="ml-1">
                                                <span class="stats-item">{{ distance_formatter(effort.segment.distance)
                                                }}</span>
                                                <span class="stats-item">
                                                    <gradient style="height: 17px;" />
                                                </span>
                                                <span class="stats-item">{{ effort.segment.average_grade }}%</span>
                                            </div>
                                        </div>
                                    </button>
                                </span>
                                <div v-bind:id="'collapse' + effort.id.toString()" class="accordion-collapse hide collapse"
                                    v-bind:aria-labelledby="'header' + effort.id.toString()">
                                    <div>
                                        <apexchart class="apex-chart" :options="chartOptions"
                                            :series="effort.segment.effort_series">
                                        </apexchart>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style>
.badge-item {
    padding-right: 0.3em;
}

.stats-item {
    padding-right: 0.3em;
    font-weight: 300;
}

.strava_logo:hover {
    opacity: 0.5;
    background-color: transparent;
}

.accordion-item:hover {
    border-width: 0px 3px 0px 0px !important;
    border-color: var(--bs-blue) !important;
}

.accordion-button:after {
    order: -1;
    margin-left: 0;
    margin-right: 0.5em;
}

.accordion-button {
    font-size: inherit;
    padding: 2px 0px;
}

.accordion-body {
    padding: 2px 0px;
}
</style>
