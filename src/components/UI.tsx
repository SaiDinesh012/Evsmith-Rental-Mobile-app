import React from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, shadow } from "../theme";

export function Button({title, onPress, outline=false, disabled=false}: any) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.btn, outline && styles.outline, disabled && {opacity:.5}]}>
    <Text style={[styles.btnText, outline && {color: COLORS.navy}]}>{title}</Text>
  </Pressable>
}
export function Input({label, secureTextEntry, style, ...props}: any) {
  const [hidden, setHidden] = React.useState(!!secureTextEntry);
  return (
    <View style={{marginBottom:12}}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        <TextInput
          {...props}
          secureTextEntry={secureTextEntry !== undefined ? hidden : false}
          placeholderTextColor="#9AA5AE"
          style={[styles.input, secureTextEntry !== undefined && {paddingRight: 44}, style]}
        />
        {secureTextEntry !== undefined && (
          <Pressable
            onPress={() => setHidden(!hidden)}
            hitSlop={12}
            style={styles.eyeBtn}
          >
            <Ionicons
              name={hidden ? "eye-off-outline" : "eye-outline"}
              size={20}
              color="#64748B"
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}
export function Card({children, style}: any) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Header({title, onBack}: any) {
  return <View style={styles.header}>{onBack ? <Pressable onPress={onBack} hitSlop={10}><Ionicons name="chevron-back" size={26} color={COLORS.navy}/></Pressable> : <View style={{width:28}}/>}<Text style={styles.title}>{title}</Text><View style={{width:28}}/></View>;
}

export function Loader() { return <View style={{padding:30}}><ActivityIndicator color={COLORS.green}/></View>; }
export function BikeImage({uri}: {uri?: string}) {
  return uri ? <Image source={{uri}} style={{width:"100%",height:170,borderRadius:14}}/> :
    <View style={styles.placeholder}><Text style={{fontSize:56}}>🛵</Text></View>;
}
export const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:COLORS.bg},
  content:{padding:18,paddingBottom:40},
  header:{height:62,flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:18,backgroundColor:COLORS.white},
  back:{fontSize:38,color:COLORS.navy,lineHeight:40}, title:{fontSize:20,fontWeight:"800",color:COLORS.navy},
  btn:{backgroundColor:COLORS.green,borderRadius:12,minHeight:48,alignItems:"center",justifyContent:"center",paddingHorizontal:18,marginTop:8},
  outline:{backgroundColor:COLORS.white,borderWidth:1.5,borderColor:COLORS.green},btnText:{color:COLORS.white,fontSize:15,fontWeight:"800"},
  label:{fontSize:13,fontWeight:"700",color:COLORS.text,marginBottom:6},
  inputContainer:{position:"relative",justifyContent:"center"},
  input:{backgroundColor:COLORS.white,borderWidth:1,borderColor:COLORS.border,borderRadius:10,paddingHorizontal:13,height:48,color:COLORS.text},
  eyeBtn:{position:"absolute",right:12,height:"100%",justifyContent:"center",alignItems:"center",paddingHorizontal:4},
  card:{backgroundColor:COLORS.white,borderRadius:16,padding:15,marginBottom:14,...shadow},
  h1:{fontSize:28,fontWeight:"900",color:COLORS.navy}, h2:{fontSize:19,fontWeight:"800",color:COLORS.navy},
  muted:{color:COLORS.muted}, row:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
  pill:{paddingHorizontal:10,paddingVertical:6,borderRadius:20,backgroundColor:"#E8F7E8",alignSelf:"flex-start"},
  pillText:{fontSize:12,fontWeight:"800",color:COLORS.greenDark},
  placeholder:{height:170,borderRadius:14,backgroundColor:"#EFF5EF",alignItems:"center",justifyContent:"center"}
});
