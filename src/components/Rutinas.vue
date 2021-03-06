<template>
    <div>
        <nav-bar/>
        <v-container>
            <v-row align="center" justify="center">
                <v-col>
                    <v-alert
                            v-model="alert"
                            :value="!alert"
                            transition="scale-transition"
                            dense
                            text
                            :type="alertType"
                            class="ma-auto"
                    >
                        {{alertMessage}}
                    </v-alert>
                </v-col>
            </v-row>
            <v-row align="center" justify="center">
                <v-col>
                    <v-card v-for="routine in routines" :key="routine.name" elevation="5" class="mx-auto my-2 rounded"
                            max-width="750"
                            max-height="80"
                    >
                        <v-container fluid>
                            <v-row no-gutters>
                                <v-col cols="1">
                                    <v-menu offset-y
                                            transition="slide-y-transition"
                                            bottom>
                                        <template v-slot:activator="{ on }">
                                            <v-btn text top fab
                                                   v-on="on"
                                            >
                                                <v-icon>mdi-dots-vertical</v-icon>
                                            </v-btn>
                                        </template>
                                        <v-list>
                                            <v-list-item class="pa-0">

                                                <v-dialog v-model="routineEliminateDialog" max-width="330">
                                                    <template v-slot:activator="{ on }">
                                                        <v-btn text v-on="on">
                                                            Eliminar
                                                        </v-btn>
                                                    </template>
                                                    <v-alert class="my-0 pa-0" border="top" colored-border color="red">
                                                        <v-card-text class="pb-0 display-1">Eliminar Rutina</v-card-text>
                                                        <v-card-text class="subtitle-2">
                                                            ¿Está seguro que quiere eliminar la Rutina: "{{routine.name}}"?
                                                        </v-card-text>
                                                        <v-card tile class="blue-grey lighten-5">
                                                            <v-card-actions>
                                                                <v-btn depressed color="white" @click="routineEliminateDialog = false">
                                                                    Cancelar
                                                                </v-btn>
                                                                <v-spacer></v-spacer>
                                                                <v-btn color="error" @click="deleteCurrentRoutine(routine.id)">
                                                                    Eliminar
                                                                </v-btn>
                                                            </v-card-actions>
                                                        </v-card>
                                                    </v-alert>
                                                </v-dialog>
                                            </v-list-item>
                                        </v-list>
                                    </v-menu>
                                </v-col>
                                <v-col cols="8" >
                                    <v-list-item dense>
                                        <v-list-item-avatar color="#C6FFAB">
                                            <v-icon class="ml-2"  flat color="black" large left>mdi-clipboard-list-outline</v-icon>
                                        </v-list-item-avatar>
                                        <v-list-item-content>
                                            <v-list-item-title class="headline pt-1 pb-2 ">{{routine.name}}</v-list-item-title>
                                            <v-list-item-subtitle>{{routine.meta.desc}}</v-list-item-subtitle>
                                        </v-list-item-content>
                                    </v-list-item>
                                </v-col>
                                <v-col align-self="center">
                                    <v-card-actions right>
                                        <v-spacer></v-spacer>
                                        <v-btn rounded color="primary" dark right :loading="auxRoutine[routine.id].loadingFlag" @click="executeRoutine(routine.id, routine.name)">
                                            Ejecutar
                                            <v-icon >mdi-play</v-icon>
                                        </v-btn>
                                    </v-card-actions>
                                </v-col>
                            </v-row>
                        </v-container>
                    </v-card>
                </v-col>
            </v-row>
            <v-row align="center" justify="center">
                <v-col>
                    <v-container fluid>
                        <v-row no-gutters>
                            <v-col align-self="center" justify="center">
                                <v-btn height="70" width="750"  class="ma-auto text--secondary border-dashed rounded" :to="{ name: 'nuevarutina' }"  text>
                                    <v-icon large dark>mdi-plus</v-icon>
                                    Registrar Rutina
                                </v-btn>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script>
    import NavBar from "./NavBar";
    import Api from "../assets/js/Api";
    export default {
        name: "Rutinas",
        components: {NavBar},
        data() {
            return {
                routines: [],
                RoutineEditDialog:false,
                routineEliminateDialog:false,
                currentRoutineID:false,
                currentRoutine: null,
                currentRoutineSuccess: true,
                alert:false,
                auxRoutine: {},
                timeout: 3000,
            }
        },
        mounted() {
            this.getRoutines();
        },
        methods: {
            getRoutines(){
                Api.routine.getAll().then(data => {
                    this.routines = data.result;
                    this.routines.forEach(elem =>{
                        this.auxRoutine[elem.id] = {loadingFlag : false};
                    })
                }).catch(console.log);
            },
            deleteCurrentRoutine(routineID){
                Api.routine.delete(routineID).
                then(()=> this.getRoutines())
                    .catch(console.log);
            },
            executeRoutine(routineID, title){
                this.auxRoutine[routineID].loadingFlag = true;
                this.currentRoutine = title;
                Api.routine.execute(routineID)
                    .then( () => {
                        this.getRoutines();
                        setTimeout(function () {
                            this.alert=false;
                        }.bind(this),3000);
                        this.currentRoutineSuccess = true;
                    })
                    .catch(error => {
                        console.log(error);
                        this.currentRoutineSuccess = false;
                    })
                    .finally( () => {
                        this.auxRoutine[routineID].loadingFlag = false;
                        this.alert = true;
                    });
            }
        },
        computed: {
            alertType(){
                return (this.currentRoutineSuccess)? 'success' : 'error';
            },
            alertMessage(){
                if(this.currentRoutineSuccess)
                    return `Rutina ${this.currentRoutine} ejecutada correctamente`;
                else
                    return `Hubo un error al ejecutar la rutina ${this.currentRoutine}. Verifique que todos los dispositivos de la rutina estén habilitados`;
            }
        }
    }
</script>

<style scoped>
    .rounded{
        border-radius: 25px;
    }
    .v-card.rounded.v-sheet{
        border-radius: 25px;
    }
    .top-rounded{
        border-top-left-radius: 25px;
        border-top-right-radius: 25px;
    }
    .border-dashed{
        border-radius: 25px 25px 25px 25px;
        -moz-border-radius: 25px 25px 25px 25px;
        -webkit-border-radius: 25px 25px 25px 25px;
        border: 3px dashed #a6a6a6;
    }
    .v-list-item__content{
        text-align: left;
    }

</style>