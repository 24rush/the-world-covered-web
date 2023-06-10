import type { LatLngExpression } from "leaflet";
import { LatLngMeta } from "./metadata";

export default class PolylineDecoder {

    static readonly defaultOptions: any = {
        precision: 5,
        factor: Math.pow(10, 5),
        dimension: 2
    };

    public static decodePolyline(encoded: any) : LatLngMeta[] {
        return PolylineDecoder.decode(encoded, PolylineDecoder.defaultOptions);
    }

    static decode(encoded: any, options: any) : LatLngMeta[] {
        var flatPoints = PolylineDecoder.decodeDeltas(encoded, options);

        var points : LatLngMeta[] = [];
        for (var i = 0, len = flatPoints.length; i + (options.dimension - 1) < len;) {
            var point : LatLngMeta = new LatLngMeta(flatPoints[i++], flatPoints[i++]);
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

    static encodePolyline(points: any, options?: any) : string {
        options = options ?? PolylineDecoder.defaultOptions;

        var flatPoints = [];
        for (var i = 0, len = points.length; i < len; ++i) {
            var point = points[i];

            if (options.dimension === 2) {
                flatPoints.push(point.lat || point[0]);
                flatPoints.push(point.lng || point[1]);
            } else {
                for (var dim = 0; dim < options.dimension; ++dim) {
                    flatPoints.push(point[dim]);
                }
            }
        }

        return this.encodeDeltas(flatPoints, options);
    }

    static encodeDeltas(numbers: any, options: any) {
        options = PolylineDecoder.defaultOptions;

        var lastNumbers = [];

        for (var i = 0, len = numbers.length; i < len;) {
            for (var d = 0; d < options.dimension; ++d, ++i) {
                var num = numbers[i].toFixed(options.precision);
                var delta = num - (lastNumbers[d] || 0);
                lastNumbers[d] = num;

                numbers[i] = delta;
            }
        }

        return this.encodeFloats(numbers, options);
    }

    static encodeFloats(numbers: any, options: any) {
        options = PolylineDecoder.defaultOptions;

        for (var i = 0, len = numbers.length; i < len; ++i) {
            numbers[i] = Math.round(numbers[i] * options.factor);
        }

        return this.encodeSignedIntegers(numbers);
    }

    static encodeSignedIntegers(numbers: any) {
        for (var i = 0, len = numbers.length; i < len; ++i) {
            var num = numbers[i];
            numbers[i] = (num < 0) ? ~(num << 1) : (num << 1);
        }

        return this.encodeUnsignedIntegers(numbers);
    }

    static encodeUnsignedIntegers(numbers: any) {
        var encoded = '';
        for (var i = 0, len = numbers.length; i < len; ++i) {
            encoded += this.encodeUnsignedInteger(numbers[i]);
        }
        return encoded;
    }

    static encodeSignedInteger(num: any) {
        num = (num < 0) ? ~(num << 1) : (num << 1);
        return this.encodeUnsignedInteger(num);
    }

    static encodeUnsignedInteger(num: any) {
        var value, encoded = '';
        while (num >= 0x20) {
            value = (0x20 | (num & 0x1f)) + 63;
            encoded += (String.fromCharCode(value));
            num >>= 5;
        }
        value = num + 63;
        encoded += (String.fromCharCode(value));

        return encoded;
    }
}