<template>
    <v-container class="py-0">
        <v-row align="baseline" justify="start">
            <v-col cols="3">
                <v-list-item class="px-0">
                    <v-list-item-content>
                        <v-list-item-title class="subtitle-1">{{$vuetify.lang.t(`$vuetify.${params.name}`)}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-col>
            <v-col class="py-0">
                <v-select :items="roomItems" v-model="value" @change="$emit('change', value)"/>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>

    export default {
        name: "RoomValue",
        props:{
            params:{
                type: Object,
                require: true,
            },
            rooms: {
                type: Array,
                require: true
            }
        },
        data(){
            return {
                roomItems: this.rooms.map( elem => { return {text: elem.text, value: elem.value.id}}),
                value: null
            }
        }
    }
</script>

<style scoped>

</style>