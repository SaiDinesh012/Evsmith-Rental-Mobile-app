import React,{useState} from "react";
import {Alert,ScrollView,Text} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Button,Input,styles} from "../../components/UI";
import {api} from "../../api";
export default function AddressScreen({navigation,route}:any){const [current,setCurrent]=useState("");const [same,setSame]=useState(true);const [permanent,setPermanent]=useState("");
 const next=async()=>{try{const token=await AsyncStorage.getItem("registrationToken");if(token) await AsyncStorage.setItem("token",token);await api.put("/me",{currentAddress:current,permanentAddress:same?current:permanent});navigation.navigate("Documents",{email:route.params.email});}catch(e:any){Alert.alert("Save failed",e?.response?.data?.message||"Try again");}};
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.h1}>Address Details</Text><Text style={styles.muted}>2/3</Text><Input label="Current Address" value={current} onChangeText={setCurrent} multiline placeholder="Enter your current address"/><Text onPress={()=>setSame(!same)} style={{marginBottom:12,color:"#078A31",fontWeight:"800"}}>{same?"☑":"☐"} Same as current address</Text>{!same&&<Input label="Permanent Address" value={permanent} onChangeText={setPermanent} multiline/>}<Button title="Next" onPress={next}/></ScrollView>}
