<script setup lang="ts">
import gradient from '@/icons/gradient.vue';
import { reactive, onMounted, ref } from 'vue';
import Strava from '@/icons/strava.vue';
import { ActivityMetaData } from '@/data_types/metadata';
import {Formatters} from '@/components/formatters'

const emit = defineEmits(['onNextGradient', 'onPreviousGradient'])

const props = defineProps({
    route: {
        type: ActivityMetaData,
    },
});

var accordion_open = ref(false);

const chartOptions = reactive({
    chart: {
        toolbar: {
            show: false
        },
        selection: {
            enabled: false
        },
        zoom: {
            enabled: false
        }
    },
    fill: {
        opacity: [0.85],
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
        width: [1.],
        curve: 'smooth'
    },
    xaxis: {
        type: 'numeric',
        title: { text: "Distance from start of gradient" }
    },
    animations: {
        enabled: false,
    },
    colors: ['#008FFB', '#00E396'],
    tooltip: {
        //@ts-ignore
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
            series; seriesIndex; dataPointIndex; w;
            return '<div class="arrow_box">' +
                '<span>' + w.config.series[0].incline[dataPointIndex].toFixed(1) + "%" + '</span>' +
                '</div>'
        }
    },
    yaxis: [{
        title: {
            text: 'Altitude',
        }
    }],
    legend: {
        show: true
    }
});

onMounted(() => {
});

</script>
<template>
    <div v-if="route && route.gradients.length != 0" id="gradientCarousel" class="carousel segment-carousel slide">
        <div class="carousel-inner" style="width: 85%; margin: auto;">
            <div v-for="(gradient, index) in route.gradients" :key="gradient.id" class="carousel-item"
                v-bind:id="'gradient' + gradient.id" :class="{ 'active': index == 0 }">
                <div class="d-flex accordion accordion-flush">
                    <div class="accordion-item" style="width: 100%;">
                        <span class="accordion-header" v-bind:id="'header' + gradient.id.toString()">
                            <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse"
                                :data-bs-target="'#collapse' + gradient.id.toString()" aria-expanded="true"
                                v-on:click="accordion_open = !accordion_open"
                                v-bind:aria-controls="'collapse' + gradient.id.toString()">
                                <div>
                                    <span>{{ route.location_city }}, </span><span>&nbsp;{{ route.location_country }}</span>
                                    <div class="ml-1">
                                        <span style="padding-right: 0.5em;">{{
                                            Formatters.distance_formatter(gradient.length)
                                        }}</span>
                                        <gradient style="height: 20px;" />
                                        <span>{{ gradient.avg_gradient.toFixed(1) }}%</span>
                                        <span class="stats-item">
                                            avg.
                                        </span>
                                        <span>{{ gradient.max_gradient.toFixed(1) }}%</span>
                                        <span class="stats-item">
                                            max.
                                        </span>
                                    </div>
                                </div>
                            </button>
                        </span>
                        <div v-bind:id="'collapse' + gradient.id.toString()" class="accordion-collapse hide collapse"
                        :class="{'show': accordion_open, 'hide': !accordion_open}"
                            v-bind:aria-labelledby="'header' + gradient.id.toString()">
                            <div style="padding-left: 1.8em; padding-top: 0.7em;">
                                <span style="padding-left: 0.2em;"><a class="strava_logo"
                                        v-bind:href="`https://www.strava.com/activities/${route.master_activity_id}`"
                                        target="_blank">
                                        <Strava />
                                    </a></span>
                            </div>
                            <div style="margin-top: -0.5em;">
                                <apexchart class="apex-chart" :options="chartOptions"
                                    :series="[{ name: 'Altitude', incline: route.gradients[0].incline, data: route.gradients[0].altitude.map((g, i) => [route?.gradients[0].distance[i], g]) }]">
                                </apexchart>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <button class="carousel-control-prev btn-carousel btn-carousel-left" type="button"
            data-bs-target="#gradientCarousel" data-bs-slide="prev"
            v-on:click="emit('onPreviousGradient', route?.gradients[0].id)">
            <i class="bicons bi bi-chevron-left" aria-hidden="true"></i>
            <span class="visually-hidden">Previous</span>
        </button>
        <button class="carousel-control-next btn-carousel btn-carousel-right" type="button"
            data-bs-target="#gradientCarousel" data-bs-slide="next"
            v-on:click="emit('onNextGradient', route?.gradients[0].id)">
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
    width: 100%;

    margin-left: auto;
    margin-right: auto;
}

.carousel-item {
    transition: transform .4s ease-in-out !important;
}
</style>