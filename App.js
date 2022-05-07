import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RefreshControl, View, Text, FlatList, StyleSheet} from 'react-native';
import { TextInput, Button, Portal, Provider, Snackbar, List, TouchableRipple, ActivityIndicator, Modal } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import axios from "axios";

const baseUrl = 'https://plate-notifications.herokuapp.com' // Notification API URL

// Home Screen
function Home({route, navigation}){

    const userToken = route.params.item

    // Refresh timers
    const [refreshing, setRefreshing] = useState(false);
    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        getNotifs().then(() => setRefreshing(false));
    }, []);

    const [isLoading, setLoading] = useState(false);
    const [data, setData] = useState([]);

    const [currentToken, setCurrentToken] = useState();

    const [modalVisible, setModalVisible] = useState(false);
    const showModal = () => setModalVisible(true);
    const hideModal = () => setModalVisible(false);

    const [passText, setPassText] = useState('');

    const Item = ({ item }) => (
        <TouchableRipple onPress={ () => {
            setCurrentToken(item)
            showModal()
        }}>
            <List.Item
                title={item.message}
                description={item.created_at}
                left={props => <List.Icon {...props} icon="alert" />}
            />
        </TouchableRipple>
    );

    const getNotifs = async () => {
        try {
            setLoading(true);
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
            navigation.navigate("SignIn")
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        getNotifs();
    }, []);

    return(
        <View>
            {isLoading ? <ActivityIndicator/> : (
                <FlatList
                    data = {data}
                    renderItem = {Item}
                    keyExtractor = {item => item.id}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }
                />
            )}
            <Provider>
                <Portal>
                    <Modal
                        visible={modalVisible}
                        onDismiss={ () => {
                            onRefresh()
                            hideModal()
                        }}
                        contentContainerStyle={{backgroundColor: 'white', padding: 20, margin: 20}}
                    >
                        <Text>Type password to confirm:</Text>
                        <TextInput
                            label="Password"
                            secureTextEntry={true}
                            value={passText}
                            onChangeText={passText => setPassText(passText)}
                        />
                        <Button
                            mode="contained"
                            onPress={() => {
                                axios.post(
                                    `${baseUrl}/authenticate-token`,
                                    {
                                        password: `${passText}`,
                                        token: `${currentToken.token}`,
                                    },
                                    {
                                        headers: {
                                            Authorization: `Bearer ${userToken}`,
                                        }
                                    }
                                ).then( // If successful
                                    function (response) {
                                        onRefresh()
                                        hideModal()
                                    }
                                ).catch( // If fails
                                    function (error) {
                                        console.log(error)
                                    }
                                )
                            }}
                        >
                            Confirm
                        </Button>
                    </Modal>
                </Portal>
            </Provider>
        </View>
    )
}

// Signup Screen
function SignUp({navigation}) {
    const [emailText, setEmailText]  = useState('');
    const [passText, setPassText] = useState('');
    const [confirmText, setConfirmText] = useState('');

    const [isLoading, setLoading] = useState(false);

    const [errorMsg, setErrorMsg] = useState('');
    const [snackVisible, setSnackVisible] = useState(false);
    const onToggleSnackBar = () => setSnackVisible(!snackVisible);
    const onDismissSnackBar = () => setSnackVisible(false);

    return (
        <View style={{flex: 1, justifyContent: 'center', alignSelf: 'center', width: '75%'}}>
            <TextInput
                label="Email"
                value={emailText}
                onChangeText={emailText => setEmailText(emailText)}
            />
            <TextInput
                label="Password"
                secureTextEntry={true}
                value={passText}
                onChangeText={passText => setPassText(passText)}
            />
            <TextInput
                label="Confirm password"
                secureTextEntry={true}
                value={confirmText}
                onChangeText={confirmText => setConfirmText(confirmText)}
            />
            <Button 
                mode="contained"
                loading={isLoading}
                disabled={isLoading}
                onPress={() => {
                    if(passText === confirmText){
                        setLoading(true)
                        axios.post(
                            `${baseUrl}/signup`,
                            {
                                email: `${emailText}`,
                                password: `${passText}`
                            }
                        ).then( // If successful
                            function (response) {
                                navigation.navigate("SignIn")
                                setLoading(false)
                            }
                        ).catch( // If fails
                            function (error) {
                                console.log(error)
                                setErrorMsg(`${error}`)
                                onToggleSnackBar()
                                setLoading(false)
                            }
                        )
                    } else {
                        setErrorMsg("Make sure passwords are identical!")
                        onToggleSnackBar()
                        console.log("ERROR: Password confirmation failed")
                    }
                }}
            >
                Sign Up
            </Button>
            <Snackbar
                visible={snackVisible}
                onDismiss={() => {
                    onDismissSnackBar()
                    setErrorMsg("")
                }}
            >
               {errorMsg}
            </Snackbar>
        </View>
    );
}

// Signin Screen
function SignIn({navigation}) {
    const [emailText, setEmailText]  = useState('');
    const [passText, setPassText] = useState('');

    const [errorMsg, setErrorMsg] = useState('');
    const [snackVisible, setSnackVisible] = useState(false);
    const onToggleSnackBar = () => setSnackVisible(!snackVisible);
    const onDismissSnackBar = () => setSnackVisible(false);

    const [isLoading, setLoading] = useState(false);

    return (
        <View style={{flex: 1, justifyContent: 'center', alignSelf: 'center', width: '75%'}}>
            <View>
                <TextInput
                    label="Email"
                    value={emailText}
                    onChangeText={emailText => setEmailText(emailText)}
                />
                <TextInput
                    label="Password"
                    secureTextEntry={true}
                    value={passText}
                    onChangeText={passText => setPassText(passText)}
                />
                <Button
                    mode="contained"
                    loading={isLoading}
                    disabled={isLoading}
                    onPress={() => {
                        setLoading(true)
                        axios.post(
                            `${baseUrl}/signin`,
                            {
                                email: `${emailText}`,
                                password: `${passText}`
                            }
                        ).then( // If successful
                            function (response) {
                                navigation.navigate({name: "Home", params: {item: response.data.token.token}})
                                setLoading(false)
                            }
                        ).catch( // If fails
                            function (error) {
                                console.log(error)
                                setErrorMsg(`${error}`)
                                onToggleSnackBar()
                                setLoading(false)
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
                <Snackbar
                    visible={snackVisible}
                    onDismiss={() => {
                        onDismissSnackBar()
                        setErrorMsg("")
                    }}
                >
                    {errorMsg}
                </Snackbar>
            </View>
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
                </Stack.Navigator>
            <StatusBar style="auto" />
        </NavigationContainer>
  );
}