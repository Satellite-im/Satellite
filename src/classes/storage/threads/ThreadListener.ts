import { Client, ThreadID } from "@textile/hub";

interface Subscriber {
    thread: ThreadID,
    collection: string,
    keyValueFilters: object,
    callback: CallableFunction
}

interface Channel {
    thread: Array<Subscriber>
}

interface Listener {
    thread: ThreadID,
    collections: {
        [x: string]: boolean
    }
}

// Workflow:
// Request subscription to a collection by threadid
// └──> subscribe(thread, collection, filters) ── returns ƒ ──> ƒ(handlerFunc)
//       ├──  Add Subscriber ──> addSubscriber(...)
//       └──  Ensure we're subscribed to that thread::collection ──> ensureListener(...)
//            └──  If Not Subscribed ──> bindThread(...thread, collection)
//
// We now have a subscription to the thread by the given collection.
// Let's assume we have a new write event come in.
//
// Thread::collection written to
//       ├── Listner publishes event to subscribers ──> publish(thread, collection, type, update)
//       └── We iterate over the subscribers and alert any where the payloda data matches.
// 
// There are two possible types, 'update', and 'close'. 
// Close is called to notify subscribers of a closing event. This can be used to reconnect, or update the UI.


export default class ThreadListener {
    subscribers: Channel | {}
    listeners: Listener | {}
    client: Client;

    constructor(client: Client) {
        this.subscribers = {}
        this.listeners = {}
        this.client = client;
    }

    public isBound(thread: ThreadID, collection: string) : boolean {
        const listener = this.listeners[thread.toString()]
        return Boolean(listener.collections[collection])
    }

    public subscribe(thread: ThreadID, collection: string, keyValueFilters: object) {
        return (callback: CallableFunction) => {
            // save subscriber here.
            const subscriber = <Subscriber>{
                thread,
                collection,
                keyValueFilters,
                callback
            }
            this.addSubscriber(thread, subscriber)
        }
    }

    private bindThread(thread: ThreadID, collection: string) : any {
        const cb = (update: any) => {
            // Record if the connection died
            if (!update?.instance) {
                this.closeThread(thread, collection)
                this.publish(thread, collection, 'close', null)
                return
            }
            
            // Update subscribers
            this.publish(thread, collection, 'update', update.instance)
        };
    
        const filters = [
            { collectionName: collection },
            { actionTypes: ['CREATE'] }
        ]
    
        const closer = this.client.listen(thread, filters, cb)
        return closer
    }

    private closeThread(thread: ThreadID, collection: string) {
        if (!this.listeners[thread.toString()]) return
        if (!this.listeners[thread.toString()].collections[collection]) return
        this.listeners[thread.toString()].collections[collection] = false
    }

    private ensureListener(thread: ThreadID, collection: string) : Listener {
        // Make sure we have an active subscription to the thread / collection combo
        let threadListener = this.listeners[thread.toString()]
        if (!threadListener) {
            const listener = <Listener>{
                thread,
                collections: {}
            }
            this.listeners[thread.toString()] = listener
            threadListener = this.listeners[thread.toString()]
        }

        if (!threadListener.collections[collection]) {
            // We haven't listened to this thread yet, let's listen.
            threadListener.collections[collection] = {
                [collection]: this.bindThread(thread, collection)
            }
        }

        return threadListener
    }


    private addSubscriber(thread: ThreadID, subscriber: Subscriber) : number {
        const threadString = thread.toString()

        if (!this.subscribers[threadString]) {
            this.subscribers[threadString] = [subscriber]
        } else {
            this.subscribers[thread.toString()].push(subscriber)
        }

        this.ensureListener(thread, subscriber.collection)

        return this.subscribers[threadString].length - 1
    }

    private publish(thread: ThreadID, collection: string, type: string, update: any) {
        // TODO: iterate through subscribers to this collection
        // and dispatch event
    }
}