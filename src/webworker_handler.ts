export type onItem = (item: any) => void;
export type onDone = (noItems: number) => void;

class ReqCtx {
    constructor(public type: string, public onItem: onItem, public onDone?: onDone) {
    }
}

export default class DataHandler {
    worker: Worker;

    req_no: number = 0;
    ongoing_requests: Map<number, ReqCtx> = new Map();

    constructor() {
        this.worker = new Worker(
            new URL('./worker.js', import.meta.url),
            { type: 'module' }
        );

        this.worker.addEventListener("message", this.onWorkerMessageReceived.bind(this));
    }

    public execute(type: string, query: any, onItem: onItem, onDone?: onDone) {
        this.req_no++;
        this.ongoing_requests.set(this.req_no, new ReqCtx(type, onItem, onDone));

        this.worker.postMessage({ reqNo: this.req_no, query_type: type, query: query });
    }

    onWorkerMessageReceived(event: any) {
        let reqNo = event.data.reqNo;
        let context = this.ongoing_requests.get(reqNo);

        if (context) {
            switch (event.data.type) {
                case "item": {
                    context.onItem(event.data.metadata);
                    break;
                }
                case "done": {
                    if (context.onDone)
                        context.onDone(event.data.noItems);
                        
                    this.ongoing_requests.delete(reqNo);
                    break;
                }
            }
        }
    }
}