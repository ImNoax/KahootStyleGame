type CallbackSignature = (...params: (string | number | object | boolean)[]) => void;
type Event = string;
type Payload = string | number | object | boolean | undefined;

export class SocketMock {
    serverEvents = new Map<Event, CallbackSignature[]>();
    clientUniqueEvents = new Map<Event, Payload>();

    get nEmittedEvents() {
        return this.clientUniqueEvents.size;
    }

    on(event: string, callback: CallbackSignature): void {
        if (!this.serverEvents.has(event)) this.serverEvents.set(event, []);
        this.serverEvents.get(event)?.push(callback);
    }

    emit(event: string, payload?: Payload): void {
        if (!this.clientUniqueEvents.has(event)) this.clientUniqueEvents.set(event, payload);
    }

    simulateServerEmit(event: string, ...params: (string | number | object | boolean)[]) {
        const eventCallbacks = this.serverEvents.get(event);
        if (eventCallbacks) {
            for (const callback of eventCallbacks) {
                callback(...params);
            }
        }
    }
}
