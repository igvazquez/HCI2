<template>
    <v-card :id="`#${props.id}`" shaped raised>
        <v-container class="pt-0">
            <v-row dense>
                <v-col cols="12" class="px-5">
                    <disp-info
                            :device="props"
                            :state="state"
                            @delete="freeResources()"
                    ></disp-info>
                </v-col>
                <v-col cols="12" class="px-5">
                    <v-container fluid class="py-0 px-0"> <!--class="px-3 py-0" -->
                        <v-row align="center" dense justify="center"><!--class="my-0 py-0" -->
                            <v-col class="py-0"> <!--class="pr-10" -->
                                <v-btn-toggle v-model="multivaluedState.selectedValue" @change="changeState" rounded dense :mandatory="true">
                                    <v-btn v-for="(val, i) in multivaluedState.values" text :key="i" :value="i" :loading="multivaluedState.awaitingResponse" :disabled="multivaluedState.awaitingResponse || (i === 0 && !enoughBattery)">
                                        {{val.text}}
                                    </v-btn>
                                </v-btn-toggle>
                            </v-col>
                            <v-col>
                                <v-btn-toggle v-model="mode.value" rounded dense
                                              @change="mode.changeState()"
                                              :mandatory="true">
                                    <v-btn v-for="value in mode.supportedValues"
                                           text :key="value" :value="value"
                                           :loading="mode.awaitingResponse"
                                           :disabled="mode.awaitingResponse">
                                        {{$vuetify.lang.t(`$vuetify.${value}`)}}
                                    </v-btn>
                                </v-btn-toggle>
                            </v-col>
                            <v-col cols="12" class="px-5">
                                <v-container fluid class="py-0">
                                    <v-row align="baseline" justify="start">
                                        <v-col class="py-0 px-0">
                                            <v-list-item class="px-0">
                                                <v-list-item-content>
                                                    <v-list-item-title class="title">Ubicación:</v-list-item-title>
                                                </v-list-item-content>
                                            </v-list-item>
                                        </v-col>
                                        <v-col md="8" class="py-0"> <!--class="pr-10" -->
                                            <v-select :items="activeRoom.rooms" v-model="activeRoom.selectedRoom" @change="changeActiveRoom" :loading="activeRoom.awaitingResponse" :disabled="activeRoom.awaitingResponse || invalidRoomChange" dense></v-select>
                                        </v-col>
                                    </v-row>
                                </v-container>
                            </v-col>

                        </v-row>
                    </v-container>
                </v-col>
            </v-row>
        </v-container>
    </v-card>
</template>

<script>
    import DispInfo from "./DispInfo";
    import Device from "../../assets/js/Device";
    import Api from "../../assets/js/Api";
    import {SelectionField} from "../../assets/js/DevicesLib";
    import {getIconInfo, loadAllSupportedValues, setStatePolling} from "../../assets/js/lib";

    export default {
        name: "vacuum",
        components:{DispInfo},
        props: {
            props: {
                type: Device,
                required: true
            }
        },
        data(){
            return {
                iconInfo: getIconInfo(this.props.type.name),
                multivaluedState: {
                    values: [
                        { state: 'active', text: 'Prender', action: 'start'},
                        { state: 'docked', text: 'Cargar', action: 'dock'},
                        { state: 'inactive', text: 'Apagar', action: 'pause'}
                    ],
                    selectedValue: 4,
                    awaitingResponse: false
                },
                mode: new SelectionField(this.props,'mode','setMode'),
                activeRoom: {
                    rooms: null,
                    selectedRoom: null,
                    action: 'setLocation',
                    awaitingResponse: false
                },
                interval: null
            }
        },
        computed:{
            state() {
                if(this.props.state.status === 'inactive')
                    return 'Apagado';
                else if(this.props.state.status === 'docked')
                    return `Cargando - Bateria: ${this.props.state.batteryLevel}%`;
                else
                    return `Prendido - Bateria: ${this.props.state.batteryLevel}%`;
            },
            enoughBattery(){
                return this.props.state.batteryLevel >= 6;
            },
            invalidRoomChange(){
                return this.props.state.status !== 'active' || !this.enoughBattery;
            }
        },
        methods: {
            loadRooms(){
                Api.home.getHomeRooms(this.props.room.home.id)
                    .then(data => {
                        this.activeRoom.rooms = data.result.map( (room, i) => { return {id: room.id, value: i, text: room.name.split('_').pop()}} );
                        this.activeRoom.selectedRoom = this.activeRoom.rooms.findIndex( elem => elem.id === this.props.state.location.id);
                    })
                    .catch(console.log);
            },
            changeState(){
                let i = this.multivaluedState.selectedValue;
                if(i < this.multivaluedState.values.length && i >= 0) {
                    let value = this.multivaluedState.values[i];
                    this.multivaluedState.awaitingResponse = true;
                    this.props.execute(value.action)
                        .then( response => response.result && (this.props.state.status = value.state))
                        .catch(console.log)
                        .finally( () => this.multivaluedState.awaitingResponse = false);
                }
            },
            changeActiveRoom(){
                if(!this.invalidRoomChange) {
                    let room = this.activeRoom.rooms[this.activeRoom.selectedRoom];
                    this.activeRoom.awaitingResponse = true;
                    this.props.execute(this.activeRoom.action, [room.id])
                        .then(response => {
                            if(response.result){
                                this.props.state.location.id = room.id;
                                this.props.state.location.name = room.value;
                            }
                        })
                        .catch(console.log)
                        .finally(() => this.activeRoom.awaitingResponse = false);
                }
            },
            stateChangeHandler(newState){
                this.multivaluedState.selectedValue = this.multivaluedState.values.findIndex(elem => elem.state === newState.status);

                if(newState.location)
                    this.activeRoom.selectedRoom = this.activeRoom.rooms.findIndex( elem => elem.id === newState.location.id);
                else
                    this.props.state.location = {id: this.props.room.id, name: this.props.room.name};

                this.mode.value = newState.mode;
            },
            freeResources(){
                if(this.statePolling)
                    clearInterval(this.statePolling);
            }
        },
        mounted(){
            // Vacuum empieza sin una setLocation, hay que configurarselo hasta que lo tenga.
            if(!this.props.state.location)
                this.props.state.location = {id: this.props.room.id, name: this.props.room.name};

            this.statePolling = setStatePolling.call(this, this.stateChangeHandler.bind(this));

            let actions = [
                this.mode.getActionLoaderObject()
            ];
            loadAllSupportedValues(this.props.type.id, actions);

            this.multivaluedState.selectedValue = this.multivaluedState.values.findIndex(elem => elem.state === this.props.state.status);
            this.loadRooms();
        },
        beforeDestroy() {
            this.freeResources();
        },
    }
</script>

<style scoped>

</style>