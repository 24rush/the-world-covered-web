import type { LatLngExpression } from "leaflet";
import L from "leaflet";

export default class PolylineDecoder {

    public static decodePolyline(encoded: any) {
        let defaultOptions: any = {
            precision: 5,
            factor: Math.pow(10, 5),
            dimension: 2

        };

        return L.polyline(PolylineDecoder.decode(encoded, defaultOptions) as unknown as LatLngExpression[][]);
    }

    static decode(encoded: any, options: any) {
        var flatPoints = PolylineDecoder.decodeDeltas(encoded, options);

        var points = [];
        for (var i = 0, len = flatPoints.length; i + (options.dimension - 1) < len;) {
            var point = [];

            for (var dim = 0; dim < options.dimension; ++dim) {
                point.push(flatPoints[i++]);
            }

            points.push(point);
        }

        return points;
    }

    static decodeDeltas(encoded: string, options: any) {
        var lastNumbers: number[] = [];

        var numbers = PolylineDecoder.decodeFloats(encoded, options);
        for (var i = 0, len = numbers.length; i < len;) {
            for (var d = 0; d < options.dimension; ++d, ++i) {
                numbers[i] = Math.round((lastNumbers[d] = numbers[i] + (lastNumbers[d] || 0)) * options.factor) / options.factor;
            }
        }

        return numbers;
    }

    static decodeFloats(encoded: any, options: any) {

        var numbers = PolylineDecoder.decodeSignedIntegers(encoded);
        for (var i = 0, len = numbers.length; i < len; ++i) {
            numbers[i] /= options.factor;
        }

        return numbers;
    }

    static decodeSignedIntegers(encoded: any) {
        var numbers = PolylineDecoder.decodeUnsignedIntegers(encoded);

        for (var i = 0, len = numbers.length; i < len; ++i) {
            var num = numbers[i];
            numbers[i] = (num & 1) ? ~(num >> 1) : (num >> 1);
        }

        return numbers;
    }

    static decodeUnsignedIntegers(encoded: any) {
        var numbers = [];

        var current = 0;
        var shift = 0;

        for (var i = 0, len = encoded.length; i < len; ++i) {
            var b = encoded.charCodeAt(i) - 63;

            current |= (b & 0x1f) << shift;

            if (b < 0x20) {
                numbers.push(current);
                current = 0;
                shift = 0;
            } else {
                shift += 5;
            }
        }

        return numbers;
    }
}