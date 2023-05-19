import PolylineDecoder from "@/data_types/polyline_decode";
import type { LatLng, LatLngExpression } from "leaflet";

import 'leaflet/dist/leaflet.css';
import L from "leaflet";

export default class LeafletMap {
    map: L.Map;
    centered: boolean = false;

    constructor(elem_id: string) {
        this.map = L.map(elem_id);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);
    }

    public get_map() {

    }

    public add_polyline(polyline: string) {
        let gps_points = PolylineDecoder.decodePolyline(polyline);
        
        gps_points.addTo(this.map);        

        if (!this.centered) {
            this.map.setView((gps_points.getLatLngs() as LatLng[])[0], 13);
            this.centered = true;
        }
    }
}