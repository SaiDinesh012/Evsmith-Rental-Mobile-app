import React,{useState} from "react";
import {Alert,ScrollView,Text} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {Button,Input,styles} from "../../components/UI";
import {api} from "../../api";
export default function RegisterScreen({navigation}:any){
 const [form,setForm]=useState<any>({gender:"Male"}); const set=(k:string)=>(v:string)=>setForm({...form,[k]:v});
 const next=async()=>{try{if(!form.name||!form.email||!form.mobile) return Alert.alert("Required","Name, email and mobile are required");const r=await api.post("/auth/register",form);await AsyncStorage.setItem("registrationToken",r.data.token);navigation.navigate("Address",{email:form.email});}catch(e:any){Alert.alert("Registration failed",e?.response?.data?.message||"Please try again");}};
 return <ScrollView style={styles.screen} contentContainerStyle={styles.content}><Text style={styles.h1}>Create Your Account</Text><Text style={styles.muted}>1/3 • Personal Information</Text>{[["name","Full Name"],["dob","Date of Birth (DD/MM/YYYY)"],["gender","Gender"],["mobile","Mobile Number"],["alternateMobile","Alternative Mobile Number"],["email","Email ID"],["occupation","Occupation / Employer"],["occupationId","Occupation / Employer ID"]].map(([k,l])=><Input key={k} label={l} value={form[k]||""} onChangeText={set(k)} placeholder={l}/>) }<Button title="Next" onPress={next}/></ScrollView>
}
