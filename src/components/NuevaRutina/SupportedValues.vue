<template>
    <v-container class="py-0">
        <v-row align="baseline" justify="start">
            <v-col cols="3">
                <v-list-item class="px-0">
                    <v-list-item-content>
                        <v-list-item-title class="subtitle-1">{{translateName(params.name)}}</v-list-item-title>
                    </v-list-item-content>
                </v-list-item>
            </v-col>
            <v-col class="py-0">
                <v-select :items="supportedValues" v-model="value" @change="$emit('change', value)"/>
            </v-col>
        </v-row>
    </v-container>
</template>

<script>

    export default {
        name: "SupportedValues",
        props:{
          params:{
              type: Object,
              require: true,
          }
        },
        methods:{
            translateName(name){
                console.log(name);
                console.log(isNaN(name));
                if(!isNaN(name))
                    return name;
                return this.$vuetify.lang.t(`$vuetify.${name}`);
            },
        },
        data(){
            return{
                supportedValues: this.params.supportedValues.map(entry => {return{text: this.translateName(entry), value: entry}}),
                value: null
            }
        },
    }
</script>

<style scoped>

</style>