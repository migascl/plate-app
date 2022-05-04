import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Button, View, Text, TextInput, SafeAreaView, RefreshControl, FlatList, TouchableOpacity} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import axios from "axios";

const baseUrl = 'https://plate-notifications.herokuapp.com' // Notification API URL

let userToken

function AuthToken({route, navigation}){
    let item = route.params.item
    const [passText, onChangePassText] = useState('migascl');

    return(
        <SafeAreaView style={styles.container}>
            <Text>{item.message}</Text>
            <Text>{item.created_at}</Text>
            <Text>Type password to confirm:</Text>
            <TextInput style={styles.input} onChangeText={onChangePassText} value={passText}/>
            <Button
                title="Confirm"
                onPress={() => {
                    axios.post(
                        `${baseUrl}/authenticate-token`,
                        {
                            password: `${passText}`,
                            token: `${item.token}`,   
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${userToken}`,
                            }
                        }
                    ).then( // If successful
                        function (response) {
                            navigation.navigate("Home")
                        }
                    ).catch( // If fails
                        function (error) {
                            console.log(error)
                        }
                    )
                }}
        />
        </SafeAreaView>
    )
}

// Home Screen
function Home({navigation}){
    // Refresh timers
    const [refreshing, setRefreshing] = React.useState(false);
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        getNotifs().then(() => setRefreshing(false));
    }, []);

    const [isLoading, setLoading] = useState(true);
    const [data, setData] = useState([]);

    const Item = ({ item }) => (
        <TouchableOpacity onPress={ () => {navigation.navigate({name: "AuthToken", params: {item: item}})}} style={styles.item}>
            <Text style={styles.text}>{item.id}</Text>
            <Text style={styles.text}>{item.message}</Text>
        </TouchableOpacity>
    );

    const renderItem = ({ item }) => (
        <Item item={item} />
    );

    const getNotifs = async () => {
        try {
            const response = await axios.get(
                `${baseUrl}/notifications`,
                {
                    headers: {
                        Authorization: `Bearer ${userToken}`
                    }
                }
            )
            setData(response.data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getNotifs();
    }, []);

    return( 
        <SafeAreaView style={styles.container}>
            <Button
                title="Create Token" 
                onPress={() => {
                    axios.post(
                        `${baseUrl}/create-token`,
                        {
                            "plate": "H391DVSA"
                        }
                    )
                }}
            />  
            {isLoading ? <ActivityIndicator/> : (
                <FlatList
                    ListHeaderComponent={
                        <Text>Notifications</Text>
                    }
                    data = {data}
                    renderItem = {renderItem}
                    keyExtractor = {item => item.id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                />   
            )}  
        </SafeAreaView>
    )
}

// SignUp Screen
function SignUp({navigation}){
    const [emailText, onChangeEmailText] = React.useState('');
    const [passText, onChangePassText] = React.useState('');

    return(
        <View style={styles.container}>
            <Text>Sign Up</Text>
            <Text>Email</Text>
            <TextInput style={styles.input} onChangeText={onChangeEmailText} value={emailText}/>
            <Text>Password</Text>
            <TextInput style={styles.input} onChangeText={onChangePassText} value={passText}/>
            <Button
                title="Sign Up"
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
            />
        </View>
    )
}

// Signin Screen
function SignIn({navigation}) {
    const [emailText, onChangeEmailText] = useState('miguelleirosa@gmail.com');
    const [passText, onChangePassText] = useState('migascl');
    
    return (
    <View style={styles.container}>
        <Text>Sign In</Text>
        <Text>Email</Text>
        <TextInput style={styles.input} onChangeText={onChangeEmailText} value={emailText}/>
        <Text>Password</Text>
        <TextInput style={styles.input} onChangeText={onChangePassText} value={passText}/>
        <Button
            title="Login"
            onPress={() => {
                axios.post(
                    `${baseUrl}/signin`,
                    {
                        email: `${emailText}`,
                        password: `${passText}`
                    }
                ).then( // If successful
                    function (response) {
                        userToken = response.data.token.token
                        navigation.navigate("Home")
                    }
                ).catch( // If fails
                    function (error) {
                        console.log(error)
                    }
                )
            }}
        />
        <Text onPress={() => {
            navigation.navigate("SignUp")
            }}>
            Sign Up
        </Text>
    </View>
    );
}

// Start screen
export default function App() {
    console.log("Starting app")

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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
    },
    item: {
        backgroundColor: 'grey',
        padding: 20,
        marginVertical: 8,
        marginHorizontal: 16,
    },
    text: {
    fontSize: 17,
    },
});