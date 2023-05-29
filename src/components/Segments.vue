<script setup lang="ts">
import Activity from '@/data_types/activity';
import gradient from '@/icons/gradient.vue';
import Route from '@/data_types/route';
import { reactive, type PropType, onMounted } from 'vue';
import { Carousel } from 'bootstrap'

const emit = defineEmits(['segmentEffortsRequested'])

const props = defineProps({
    activity: {
        type: Activity
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
    stroke: {
        width: [0, 0],
        curve: 'smooth'
    },
    xaxis: {
        type: 'string',
    },
    animations: {
        enabled: false,
    },
    colors: ['#008FFB', '#00E396'],
    dataLabels: {
        enabled: true,
        enabledOnSeries: [0],
        formatter: function (value: number) {
            return distance_formatter(value);
        }
    },
    yaxis: [{
        labels: {
            formatter: function (value: number) {
                return distance_formatter(value);
            }
        },
        title: {
            text: 'Distance from home',
        }
    },
    {
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

onMounted(() => {
    const segmentCarousel = document.querySelector('#segmentCarousel')
    if (!segmentCarousel)
        return;

    const carousel = new Carousel(segmentCarousel, {
        interval: 2000,
        touch: true
    })

});

function distance_formatter(distance_m: number): String {
    if (distance_m > 1000)
        return (distance_m / 1000).toFixed(1) + "km"

    return distance_m.toFixed(0) + 'm';
}

function time_formatter(time_sec: number): String {
    if (time_sec >= 3600)
        return new Date(time_sec * 1000).toISOString().substring(11, 16) + "s"
    else
        return new Date(time_sec * 1000).toISOString().substring(14, 19) + "s"
}

function segmentEffortsRequested(activity: Activity | undefined, seg_id: number, effort_id: number) {
    let button = document.querySelector('[data-bs-target="#collapse' + effort_id + '"]') as HTMLElement;

    if (button && "true" === button.getAttribute('aria-expanded')) {
        emit('segmentEffortsRequested', activity, seg_id);
    }
}

</script>
<template>
    <div v-if="activity && activity?._id != 0" id="segmentCarousel" class="carousel segment-carousel slide">
        <div class="carousel-inner" style="width: 85%; margin: auto;">
            <div v-for="(effort, index) in activity.segment_efforts" :key="effort.id" class="carousel-item"
                :class="{ 'active': index == 0 }">
                <div class="d-flex accordion accordion-flush">
                    <div class="accordion-item" style="width: 100%;"
                        v-on:click="segmentEffortsRequested(activity, effort.segment.id, effort.id)">
                        <span class="accordion-header" v-bind:id="'header' + effort.id.toString()">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                :data-bs-target="'#collapse' + effort.id.toString()" aria-expanded="true"
                                v-bind:aria-controls="'collapse' + effort.id.toString()">
                                <div>
                                    <span>{{ effort.name }}</span>
                                    <div class="ml-1">
                                        <span style="padding-right: 0.5em;">{{
                                            distance_formatter(effort.segment.distance)
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

.btn-carousel {
    opacity: 1;
    width: 8%;
    background-color: white;
}

.btn-carousel-left {
    border-top-left-radius: 50rem;
    border-bottom-left-radius: 50rem;
}

.btn-carousel-right {
    border-top-right-radius: 50rem;
    border-bottom-right-radius: 50rem;
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

.segment-carousel {
    margin-top: 1.5em;
    width: 100%;
    position: absolute;
    left: 0;
    right: 0;
    top: 3em;
    margin-left: auto;
    margin-right: auto;
}
</style>