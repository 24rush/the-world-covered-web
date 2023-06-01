import PolylineDecoder from "@/data_types/polyline_decode";
import { LatLng } from "leaflet";

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

const Style_Poly_Default_Weight = 3;

class Style {
    color: string = "";
    opacity: number = 1;
    weight: number = Style_Poly_Default_Weight;
}

const HOVER_STYLE: Style = {
    color: '#0000FF',
    opacity: 1,    
    weight: Style_Poly_Default_Weight * 1.8
};

class PolylineCtx {
    constructor(public polyline: L.Polyline, public addedToMap: boolean) { }
}

export type PolyHoverCbk = (id: number, state: boolean) => void;
export type PolyClickedCbk = (id: number) => void;
export type MapClickedCbk = () => void;
export type MapCenteredAtCbk = (center: LatLng) => void;

type PolylineHandlerFnc = (id: number, polyline: L.Polyline) => void;

export default class LeafletMap {
    map: L.Map;
    elem_id_to_polyline: Map<number, PolylineCtx> = new Map();
    elem_id_to_style: Map<number, Style> = new Map();
    colors_used: Array<string> = new Array();

    already_in: Map<number, L.Polyline> = new Map();

    map_clicked_cbk: MapClickedCbk | undefined;
    map_centered_at_cbk: MapCenteredAtCbk | undefined;
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

        this.map.setView(new LatLng(45, 25), 12);

        this.map.on("mousedown", (e) => {
            if (this.map_clicked_cbk)
                this.map_clicked_cbk();
        });

        this.map.on("moveend", (e) => {
            this.last_centered_on_item_id = 0;

            if (this.map_centered_at_cbk)
                this.map_centered_at_cbk(this.map.getCenter());
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

    public register_map_centered_at_cbk(cbk: MapCenteredAtCbk) {
        this.map_centered_at_cbk = cbk;
    }

    public register_hovered_handler(cbk: PolyHoverCbk) {
        this.hover_cbk = cbk;
    }

    public register_poly_clicked_handler(cbk: PolyClickedCbk) {
        this.poly_clicked_cbk = cbk;
    }

    public center_at_latlng(latlng: LatLng) {
        this.map.setView(latlng, 9);
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

    public register_polyline(id: number, polyline: string, style?: any): L.Polyline {
        let exiting_poly = this.elem_id_to_polyline.get(id);

        if (exiting_poly) {                        
            return exiting_poly.polyline;
        }

        let self = this;
        let gps_points = PolylineDecoder.decodePolyline(polyline);

        let default_style = {
            "weight": Style_Poly_Default_Weight,
            "color": "#fc5200".toString()
        };

        if (!style)
            style = default_style;
        
        gps_points.setStyle(style);
        gps_points.redraw();

        this.elem_id_to_style.set(id, style);

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

        this.elem_id_to_polyline.set(id, new PolylineCtx(gps_points, true));
        this.addToMap(id, gps_points);

        return gps_points
    }

    public unregister_polyline(id: number) {
        let poly_ctx = this.elem_id_to_polyline.get(id);

        if (!poly_ctx)
            return;

        this.removeFromMap(id, poly_ctx.polyline);

        this.elem_id_to_polyline.delete(id);
        this.elem_id_to_style.delete(id);
    }

    public show_only(id: number) {
        let polyCtx = this.elem_id_to_polyline.get(id);

        if (polyCtx && polyCtx.addedToMap == false) {
            polyCtx.addedToMap = true;
            this.addToMap(id, polyCtx.polyline);
        }
    }

    public clear_all() {
        for (let elem of this.elem_id_to_polyline) {
            this.removeFromMap(elem[0], elem[1].polyline);
        }

        this.elem_id_to_polyline.clear();
        this.elem_id_to_style.clear();
    }

    public hide_all() {
        this.elem_id_to_polyline.forEach((elem, key) => {
            elem.addedToMap = false;
            this.removeFromMap(key, elem.polyline);
        });
    }

    public show_all() {
        this.elem_id_to_polyline.forEach((elem, key) => {
            if (elem.addedToMap == false) {
                elem.addedToMap = true;
                this.addToMap(key, elem.polyline);
            }
        });
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

    public unhighlight_all() {
        this.elem_id_to_polyline.forEach((v, key) => {
            this.unhighlight_polyline(key, v.polyline);
        });
        this.last_hovered_item_id = 0;
    }

    private do_with_elem_id(elem_id: number, handler: PolylineHandlerFnc) {
        let polyCtx = this.elem_id_to_polyline.get(elem_id);

        if (polyCtx) {
            handler.bind(this, elem_id, polyCtx.polyline)();
        }
    }

    private highlight_polyline(id: number, polyline: L.Polyline) {
        polyline.setStyle(HOVER_STYLE);
        polyline.setStyle({ 'weight': Style_Poly_Default_Weight * 1.8 });
        polyline.bringToFront();
    }

    private unhighlight_polyline(id: number, polyline: L.Polyline) {
        let prev_style = this.elem_id_to_style.get(id);

        if (prev_style) {
            polyline.setStyle(prev_style);
        }

        polyline.setStyle({ 'weight': Style_Poly_Default_Weight })
    }

    private addToMap(id: number, polyline: L.Polyline) : boolean {
        if (this.already_in.get(id)) {            
            return false;
        }

        this.already_in.set(id, polyline);
        polyline.addTo(this.map);

        return true;
    }

    private removeFromMap(id: number, polyline: L.Polyline) {
        this.already_in.delete(id);
        polyline.removeFrom(this.map);
    }
}