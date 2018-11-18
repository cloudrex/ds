import {GatewayHelloMessage} from "./gateway-messages";
import {ClientIdentifyMessage} from "./client-messages";
import {OpCode} from "./op-codes";
import ClientManager, {GatewayBotInformation} from "../client-manager";
import Client, {ClientPresenceStatus} from "../client";
import {ClientEvent} from "./client-events";
import {IMsg} from "../core/message";

export default class GatewayHandler {
    private readonly client: Client;
    private readonly manager: ClientManager;
    
    // TODO
    private lastHeartbeat: number | null = null;

    public constructor(client: Client, manager: ClientManager) {
        this.client = client;
        this.manager = manager;

        // OpCode handlers
        this.on(OpCode.Hello, this.hello);

        // Client events handlers
        this.on(ClientEvent.MessageCreate, this.message);
    }

    private on(opCode: number | string, handler: any): void {
        this.manager.on(opCode.toString(), handler.bind(this));
    }

    public hello(data: any): void {
        const gatewayBotInfo: GatewayBotInformation | null = this.manager.getGatewayBotInfo();

        // TODO: Organize/optimize
        if (gatewayBotInfo === null) {
            throw new Error("Gate");
        }

        console.log(`WS Handling hello message with data`, data);

        const message: GatewayHelloMessage = data;

        // TODO: Use client setInterval() instead
        setInterval(() => {
            this.manager.send(OpCode.Heartbeat, {});
        }, message.heartbeat_interval);

        // Identify
        this.manager.send(OpCode.Identify, {
            token: this.client.token,
            compress: true,
            large_threshold: 250,
            shard: [0, gatewayBotInfo.shards],

            properties: {
                $os: "linux",
                $browser: "disco",
                $device: "disco"
            },

            presence: {
                game: {
                    name: "Testing bot",
                    type: 0
                },

                status: ClientPresenceStatus.DoNotDisturb,
                since: 91879201,
                afk: false
            }
        } as ClientIdentifyMessage);
    }

    public message(message: IMsg): void {
        this.client.emit(ClientEvent.MessageCreate, message);
    }
}