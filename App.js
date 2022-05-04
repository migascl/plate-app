import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RefreshControl, TouchableOpacity, View, Text, SafeAreaView} from 'react-native';
import { ActivityIndicator, TextInput, Button, Portal, Provider, Paragraph, Dialog } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import axios from "axios";

const baseUrl = 'https://plate-notifications.herokuapp.com' // Notification API URL

let userToken

function AuthToken({route, navigation}){

    return(
        <SafeAreaView>
            
        </SafeAreaView>
    )
}

// Home Screen
function Home({navigation}){

    return(
        <SafeAreaView>
            
        </SafeAreaView>
    )
}

// Signup Screen
function SignUp({navigation}) {
    const [emailText, setEmailText]  = useState('');
    const [passText, setPassText] = useState('');
    const [confirmText, setConfirmText] = useState('');

    return (
        <View style={{flex: 1, justifyContent: 'center', alignSelf: 'center', width: '75%'}}>
            <TextInput
                label="Email"
                value={emailText}
                onChangeText={emailText => setEmailText(emailText)}
            />
            <TextInput
                label="Password"
                value={passText}
                onChangeText={passText => setPassText(passText)}
            />
            <TextInput
                label="Confirm password"
                value={confirmText}
                onChangeText={confirmText => setConfirmText(confirmText)}
            />
            <Button 
                mode="contained"
                onPress={() => {
                    axios.post(
                        `${baseUrl}/signup`,
                        {
                            email: `${emailText}`,
                            password: `${passText}`
                        }
                    ).then( // If successful
                        function (response) {
                            navigation.navigate("SignIn")
                        }
                    ).catch( // If fails
                        function (error) {
                            console.log(error)
                        }
                    )
                }}
            >
                Sign Up
            </Button>
        </View>
    );
}

// Signin Screen
function SignIn({navigation}) {
    const [emailText, setEmailText]  = useState('miguelleirosa@gmail.com');
    const [passText, setPassText] = useState('migascl');

    return (
        <View style={{flex: 1, justifyContent: 'center', alignSelf: 'center', width: '75%'}}>
            <TextInput
                label="Email"
                value={emailText}
                onChangeText={emailText => setEmailText(emailText)}
            />
            <TextInput
                label="Password"
                value={passText}
                onChangeText={passText => setPassText(passText)}
            />
            <Button 
                mode="contained"
                onPress={() => {
                    showDialog
                    axios.post(
                        `${baseUrl}/signin`,
                        {
                            email: `${emailText}`,
                            password: `${passText}`
                        }
                    ).then( // If successful
                        function (response) {
                            userToken = response.data.token.token
                            hideDialog
                            navigation.navigate("Home")
                        }
                    ).catch( // If fails
                        function (error) {
                            console.log(error)
                        }
                    )
                }}
            >
                Log in
            </Button>
            <Text 
                onPress = {() => {
                    navigation.navigate("SignUp")
                }}
            >
                Sign Up
            </Text>
        </View>
    );
}

// Start screen
export default function App() {

    const Stack = createNativeStackNavigator();
    return (
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen name="SignIn" component={SignIn} />
                <Stack.Screen name="SignUp" component={SignUp} />
                <Stack.Screen name="Home" component={Home} />
                <Stack.Screen name="AuthToken" component={AuthToken} />
            </Stack.Navigator>
            <StatusBar style="auto" />
        </NavigationContainer>
  );
}