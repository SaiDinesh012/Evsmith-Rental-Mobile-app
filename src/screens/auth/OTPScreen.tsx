import React,{useState} from "react";
import {Alert,Text,View} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {Button,Input,styles} from "../../components/UI";
import {api,saveAuth} from "../../api";
export default function OTPScreen({route,navigation}:any){
 const identifier=route.params?.identifier || route.params?.email || "evsmith@gmail.com";
 const [otp,setOtp]=useState("123456");
 const verify=async()=>{try{const r=await api.post("/auth/verify-otp",{email:identifier,mobile:identifier,identifier,otp});await saveAuth(r.data.token,"USER");navigation.reset({index:0,routes:[{name:"User"}]});}catch(e:any){Alert.alert("Invalid OTP",e?.response?.data?.message||"Use 123456 in demo");}};
 return <SafeAreaView edges={['top','left','right']} style={styles.screen}><View style={[styles.content,{paddingTop:40}]}><Text style={styles.h1}>Verify OTP</Text><Text style={[styles.muted,{marginVertical:14}]}>We sent a 6-digit code to {identifier}</Text><Input label="OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} placeholder="123456"/><Button title="Verify" onPress={verify}/><Text style={{textAlign:"center",marginTop:16,color:"#718096"}}>Demo OTP: 123456</Text></View></SafeAreaView>}


