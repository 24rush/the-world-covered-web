<script setup lang="ts">
import { EffortSeries, EffortSeriesData } from '@/data_types/activity';
import gradient from '@/icons/gradient.vue';
import { reactive, ref } from 'vue';
import { Carousel } from 'bootstrap'
import Strava from '@/icons/strava.vue';
import { ActivityMetaData } from '@/data_types/metadata';
import { Formatters } from './formatters';

const emit = defineEmits(['segmentEffortsRequested', 'segmentSelected', 'segmentUnselected'])

const props = defineProps({
    activity: {
        type: ActivityMetaData,
    },
});

var accordion_open = ref(false);

var segmentCarousel: Element | null;

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
    stroke: {
        width: [0, 0],
        curve: 'smooth'
    },
    xaxis: {
        type: 'datetime',
        labels: {
            format: 'dd.MMM.yyyy'
        }
    },
    animations: {
        enabled: false,
    },
    colors: ['#008FFB', '#00E396'],
    dataLabels: {
        enabled: true,
        enabledOnSeries: [0],
        formatter: Formatters.distance_formatter
    },
    yaxis: [{
        labels: {
            formatter: Formatters.distance_formatter
        },
        title: {
            text: 'Distance from home',
        }
    },
    {
        labels: {
            formatter: Formatters.time_formatter
        },
        title: {
            text: 'Moving time',
        },
        opposite: true,
    }],
    legend: {
        show: true
    }
});

function onCarouselLoaded(el: any) {
    if (segmentCarousel == el)
        return;

    segmentCarousel = document.querySelector('#segmentCarousel');

    if (!segmentCarousel)
        return;

    let extract_seg_id = (id: string | undefined) => {
        if (!id)
            return 0;

        return parseInt(id.split('segment')[1]);
    }

    let slide_event_handler = (event: Carousel.Event) => {
        let from_elem = event.relatedTarget.parentElement?.children[event.from].id;
        let to_elem = event.relatedTarget.parentElement?.children[event.to].id;

        let to_seg_id = extract_seg_id(to_elem);

        emit('segmentUnselected', extract_seg_id(from_elem));
        emit('segmentSelected', to_seg_id);

        if (accordion_open.value) {
            emit('segmentEffortsRequested', props.activity, to_seg_id);
        }
    };

    let first_seg_id = (): number => {
        if (!segmentCarousel)
            return -1;

        return extract_seg_id(segmentCarousel.querySelectorAll('.carousel-item.active')[0].id);
    };

    segmentCarousel.addEventListener('slid.bs.carousel', slide_event_handler);

    if (accordion_open.value) {
        emit('segmentEffortsRequested', props.activity, first_seg_id());
    }

    emit('segmentSelected', first_seg_id());
}

function segmentEffortsRequested(activity: ActivityMetaData | undefined, seg_id: number, effort_id: number) {
    let button = document.querySelector('[data-bs-target="#collapse' + effort_id + '"]') as HTMLElement;

    if (button && "true" === button.getAttribute('aria-expanded')) {
        emit('segmentEffortsRequested', activity, seg_id);
    }

    accordion_open.value = !accordion_open.value;
}

function min_effort(series: EffortSeries): EffortSeriesData {
    return series.data.reduce((a, b) => a.y < b.y ? a : b);
}

</script>
<template>
    <div v-if="activity && activity.segment_efforts.length != 0" id="segmentCarousel"
        class="carousel segment-carousel slide" :ref="(el) => onCarouselLoaded(el)">
        <div class="carousel-inner" style="width: 85%; margin: auto;">
            <div v-for="(effort, index) in activity.segment_efforts" :key="index" class="carousel-item"
                v-bind:id="'segment' + effort.segment.id" :class="{ 'active': index == 0 }">
                <div class="d-flex accordion accordion-flush">
                    <div class="accordion-item" style="width: 100%;"
                        v-on:click="segmentEffortsRequested(activity, effort.segment.id, effort.id)">
                        <span class="accordion-header" v-bind:id="'header' + effort.id.toString()">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                :data-bs-target="'#collapse' + effort.id.toString()" aria-expanded="true"
                                v-bind:aria-controls="'collapse' + effort.id.toString()">
                                <div>
                                    <span>{{ effort.name }}</span>
                                    <span v-if="effort.segment.effort_series.length">&nbsp;({{
                                        effort.segment.effort_series[0].data.length }} efforts)</span>
                                    <div class="ml-1">
                                        <span style="padding-right: 0.5em;">{{
                                            Formatters.distance_formatter(effort.segment.distance)
                                        }}</span>
                                        <gradient style="height: 20px;" />
                                        <span>{{ effort.segment.average_grade }}%</span>
                                        <span class="stats-item">
                                            avg.
                                        </span>
                                        <span>{{ effort.segment.maximum_grade }}%</span>
                                        <span class="stats-item">
                                            max.
                                        </span>
                                    </div>
                                </div>
                            </button>
                        </span>
                        <div v-bind:id="'collapse' + effort.id.toString()" class="accordion-collapse collapse"
                            :class="{ 'show': accordion_open, 'hide': !accordion_open }"
                            v-bind:aria-labelledby="'header' + effort.id.toString()">
                            <div v-if="effort.segment.effort_series.length"
                                style="padding-left: 1.8em; padding-top: 0.7em;">
                                <span>Best </span>
                                <span class="fw-bold">{{
                                    Formatters.time_formatter(min_effort(effort.segment.effort_series[1]).y) }}</span>
                                <span> on </span>
                                <span class="fw-bold">{{
                                    min_effort(effort.segment.effort_series[1]).x.toLocaleDateString('en-EN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })
                                }}</span>
                                <span> with </span>
                                <span class="fw-bold" v-if="activity.type === 'RouteRide'"> {{
                                    Formatters.speed_formatter(effort.segment.distance /
                                        min_effort(effort.segment.effort_series[1]).y) }} </span>
                                <span class="fw-bold"
                                    v-if="activity.type === 'RouteHike' || activity.type === 'RouteRun'">{{
                                        Formatters.pace_formatter(effort.segment.distance /
                                            min_effort(effort.segment.effort_series[1]).y) }} </span>

                                <span style="padding-left: 0.2em;"><a class="strava_logo"
                                        v-bind:href="`https://www.strava.com/activities/${min_effort(effort.segment.effort_series[1]).activity_id}`"
                                        target="_blank">
                                        <Strava />
                                    </a></span>
                            </div>
                            <div style="margin-top: -0.5em;">
                                <apexchart class="apex-chart" :options="chartOptions"
                                    :series="effort.segment.effort_series">
                                </apexchart>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <button class="carousel-control-prev btn-carousel btn-carousel-left" type="button" data-bs-target="#segmentCarousel"
            data-bs-slide="prev">
            <i class="bicons bi bi-chevron-left" aria-hidden="true"></i>
            <span class="visually-hidden">Previous</span>
        </button>
        <button class="carousel-control-next btn-carousel btn-carousel-right" type="button"
            data-bs-target="#segmentCarousel" data-bs-slide="next">
            <i class="bicons bi bi-chevron-right" aria-hidden="true"></i>
            <span class="visually-hidden">Next</span>
        </button>
    </div>
</template>

<style>
.bicons {
    color: black
}

.carousel-item {
    transition: transform .4s ease-in-out !important;
}

</style>