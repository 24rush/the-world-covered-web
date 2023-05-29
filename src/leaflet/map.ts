import PolylineDecoder from "@/data_types/polyline_decode";
import type { LatLng, LatLngExpression } from "leaflet";

import 'leaflet/dist/leaflet.css';
import L from "leaflet";

const COLORS = [
    "#B3E5FC",
    "#81D4FA",
    "#4FC3F7",
    "#29B6F6",
    "#039BE5",
    "#0288D1",
    "#0277BD",
    "#01579B",
    "#80D8FF",
    "#40C4FF",
    "#00B0FF",
    "#0091EA"];

class Style {
    color: string = "";
    weight: number = 3;
}

const HOVER_STYLE: Style = {
    color: '#E53935',
    weight: 0
};

class PolylineCtx {
    constructor(public polyline: L.Polyline, public addedToMap: boolean) { }
}

export type PolyHoverCbk = (id: number, state: boolean) => void;
export type PolyClickedCbk = (id: number) => void;
export type MapClickedCbk = () => void;

type PolylineHandlerFnc = (id: number, polyline: L.Polyline) => void;

export default class LeafletMap {
    map: L.Map;
    centered: boolean = false;
    elem_id_to_polyline: Map<number, PolylineCtx> = new Map();
    elem_id_to_style: Map<number, Style> = new Map();
    colors_used: Array<string> = new Array();
    
    map_clicked_cbk: MapClickedCbk | undefined;
    hover_cbk: PolyHoverCbk | undefined;
    poly_clicked_cbk: PolyClickedCbk | undefined;

    last_hovered_item_id: number = 0;
    last_centered_on_item_id: number = 0;

    constructor(elem_id: string) {
        COLORS.forEach(c => this.colors_used.push(c));

        this.map = L.map(elem_id);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(this.map);

        this.map.on("mousedown", (e) => {
            if (this.map_clicked_cbk)
                this.map_clicked_cbk();
        });

        this.map.on("dragend", (e) => {
            console.log(this.map.getCenter());
        });

        this.map.on("moveend", (e) => {
            this.last_centered_on_item_id = 0;
        });

        this.map.on("zoomend", (e) => {
            this.last_centered_on_item_id = 0;
            for (let poly of this.elem_id_to_polyline) {
                let weight_for_zoom = Math.floor(this.map.getZoom() / 2.7);

                let style = this.elem_id_to_style.get(poly[0]);
                if (style) style.weight = weight_for_zoom;

                poly[1].polyline.setStyle({ "weight": weight_for_zoom });
            }
        });
    }

    public register_map_clicked_cbk(cbk: MapClickedCbk) {
        this.map_clicked_cbk = cbk;
    }

    public register_hovered_handler(cbk: PolyHoverCbk) {
        this.hover_cbk = cbk;
    }

    public register_poly_clicked_handler(cbk: PolyClickedCbk) {
        this.poly_clicked_cbk = cbk;
    }

    public center_view(elem_id: number) {
        if (this.last_centered_on_item_id == elem_id)
            return;

        this.do_with_elem_id(elem_id, (id, polyline) => {
            this.map.panTo((polyline.getLatLngs() as LatLng[])[0]);
            this.map.fitBounds(polyline.getBounds());
        });
        this.last_centered_on_item_id = elem_id;
    }

    public add_polyline(id: number, polyline: string): L.Polyline {
        let self = this;
        let gps_points = PolylineDecoder.decodePolyline(polyline);

        this.elem_id_to_polyline.set(id, new PolylineCtx(gps_points, true));

        let default_style = {
            "weight": 4,
            "color": "#fc5200".toString()
        };
        gps_points.setStyle(default_style);
        this.elem_id_to_style.set(id, default_style);

        gps_points.on("mouseover", function () {
            if (self.hover_cbk)
                self.hover_cbk(id, true);
        });

        gps_points.on("mouseout", function () {
            if (self.hover_cbk)
                self.hover_cbk(id, false);
        });

        gps_points.on("mousedown", function () {
            if (self.poly_clicked_cbk)
                self.poly_clicked_cbk(id);
        });

        gps_points.addTo(this.map);

        if (!this.centered) {
            this.map.setView((gps_points.getLatLngs() as LatLng[])[0], 13);
            this.centered = true;
        }

        return gps_points
    }

    public show_only(id: number) {
        let polyCtx = this.elem_id_to_polyline.get(id);

        if (polyCtx) {
            polyCtx.addedToMap = true;
            polyCtx.polyline.addTo(this.map);
        }
    }

    public clear_all() {
        for (let elem of this.elem_id_to_polyline) {
            elem[1].polyline.removeFrom(this.map);
        }

        this.elem_id_to_polyline.clear();
    }

    public hide_all() {
        for (let elem of this.elem_id_to_polyline) {
            if (elem[1].addedToMap == false)
                continue;

            elem[1].addedToMap = false;
            elem[1].polyline.removeFrom(this.map);
        }
    }

    public show_all() {
        for (let elem of this.elem_id_to_polyline) {
            if (elem[1].addedToMap)
                continue;

            elem[1].addedToMap = true;
            elem[1].polyline.addTo(this.map);
        }
    }

    public highlight_elem_id(elem_id: number) {
        if (this.last_hovered_item_id == elem_id)
            return;

        this.do_with_elem_id(elem_id, this.highlight_polyline);
        this.last_hovered_item_id = elem_id;
    }

    public unhighlight_elem_id(elem_id: number) {
        this.do_with_elem_id(elem_id, this.unhighlight_polyline);
        this.last_hovered_item_id = 0;
    }

    private do_with_elem_id(elem_id: number, handler: PolylineHandlerFnc) {
        let polyCtx = this.elem_id_to_polyline.get(elem_id);

        if (polyCtx) {
            handler.bind(this, elem_id, polyCtx.polyline)();
        }
    }

    private highlight_polyline(id: number, polyline: L.Polyline) {
        let curr_style = this.elem_id_to_style.get(id);

        if (curr_style) {
            polyline.bringToFront();
            polyline.setStyle(HOVER_STYLE);
            polyline.setStyle({ 'weight': curr_style.weight * 1.8 })
        }
    }

    private unhighlight_polyline(id: number, polyline: L.Polyline) {
        let prev_style = this.elem_id_to_style.get(id);

        if (prev_style) {
            polyline.setStyle(prev_style);            
            polyline.setStyle({ 'weight': prev_style.weight * 1 / 1.8 })
        }
    }
}