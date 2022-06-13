import React, { useEffect, useState } from 'react';
import {
  NavigationContainer,
  useFocusEffect,
  CommonActions,
  getFocusedRouteNameFromRoute,
  useNavigationState,
  useRoute
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
  RefreshControl,
  View,
  Text,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Alert
} from 'react-native';
import {
  TextInput,
  Button,
  Portal,
  Provider,
  Snackbar,
  List,
  TouchableRipple,
  ActivityIndicator,
  Modal,
  IconButton, Caption
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import axios from "axios";

const baseUrl = 'https://plate-notifications.herokuapp.com' // Notification API URL

// Prefilled variables for testing
const testEmail = ''
const testPassword = ''
const testPlate = ''

const getNotifs = async (userToken) => {
  try {
    console.log("try fetch")
    const response = await axios.get(
      `${baseUrl}/notifications`,
      {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    )
    return(response.data.reverse())
  } catch (error) {
    console.error(error)
  } finally {
    console.log("finally fetch")
  }
}

function History({route, navigation}) {

  React.useEffect(() => {
      console.log("history change")
    },
    [route.params.data]
  )

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', (e) => {
      console.log('history focus')
    });

    return unsubscribe;
  }, [navigation]);

  const data = () => {
    let notifs_ = []
    route.params.data.forEach((value) => {
      let diff = (Date.now() - new Date(`${value.created_at}`))
      diff = Math.floor((diff/1000)/60)
      if(diff > 5){
        notifs_.push(value)
      }
    })
    return notifs_
  }

  const Item = ({item}) => (
      <List.Item
        title={item.message}
        description={item.created_at}
        left={props => <List.Icon {...props} icon="alert"/>}
      />
  );

  return (
    <View>
      <FlatList
        data={data()}
        renderItem={Item}
        keyExtractor={item => item.id}
      />
    </View>
  )
}

function Pending({navigation, route}) {

  // Authentication state
  const [modalVisible, setModalVisible] = useState(false);
  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);
  // Password field state
  const [passText, setPassText] = useState('');

  // Selected notification token
  const [currentToken, setCurrentToken] = useState();

  React.useEffect(() => {
      console.log("pending change")
    },
    [route.params.data]
  )

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('focus', (e) => {
      console.log('pending focus')
    });

    return unsubscribe;
  }, [navigation]);

  const data = () => {
    let notifs_ = []
    route.params.data.forEach((value) => {
      let diff = (Date.now() - new Date(`${value.created_at}`))
      diff = Math.floor((diff/1000)/60)
      if(diff <= 5){
        notifs_.push(value)
      }
    })
    return notifs_
  }

  const Item = ({item}) => (
    <TouchableRipple
      onPress={() => {
        setCurrentToken(item.token)
        showModal()
      }}
    >
    <List.Item
      title={item.message}
      description={item.created_at}
      left={props => <List.Icon {...props} icon="alert"/>}
    />
    </TouchableRipple>
  );

  return (
    <Provider>
      <FlatList
        data={data()}
        renderItem={Item}
        keyExtractor={item => item.id}
      />
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
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
              console.log("attempting auth:")
              console.log("route.params.userToken: " + route.params.userToken)
              console.log("passText: " + passText)
              console.log("currentToken: " + currentToken)

              axios.post(
                `${baseUrl}/authenticate-token`,
                {
                  password: `${passText}`,
                  token: `${currentToken}`,
                },
                {
                  headers: {
                    Authorization: `Bearer ${route.params.userToken}`,
                  }
                }
              ).then( // If successful
                function (response) {

                }
              ).catch( // If fails
                function (error) {
                  console.log(error)
                }
              )
              setPassText("")
              hideModal()
            }}
          >
            Confirm
          </Button>
        </Modal>
      </Portal>
    </Provider>
  )
}

// Home Screen
function Home({route, navigation}) {

  console.log("home")

  const [data, setData] = useState([]);

  React.useEffect(() => {
      navigation.addListener('beforeRemove', (e) => {
        // Prevent default behavior of leaving the screen
        e.preventDefault();
        // Prompt the user before leaving the screen
        Alert.alert(
          "Sign Out",
          "Are you sure you want to sign out?",
          [
            {
              text: "No",
              onPress: () => console.log("Cancel Pressed"),
            },
            { text: "Yes",
              onPress: () => navigation.dispatch(e.data.action) }
          ]
        )
      })
    },
    [navigation]
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <IconButton onPress={() => navigation.goBack()} icon="logout" color="#000" />
      ),
      headerRight: () => (
        <View style={ {flexDirection: 'row'}}>
          <IconButton
            icon="refresh"
            onPress={() => {
              console.log("refresh")
              getNotifs(route.params.userToken).then( r => {
                  navigation.dispatch(
                    CommonActions.reset({
                      routes: [
                        {
                          name: 'Pending',
                          params: {userToken: route.params.userToken, data: r},
                        },
                        {
                          name: 'History',
                          params: {userToken: route.params.userToken, data: r},
                        },
                      ],
                    })
                  )
                }
              )
            }}
          />
          <IconButton icon="plus" onPress={() => {
            axios.post(
              `${baseUrl}/create-token`,
              {
                plate: `${testPlate}`
              }
            ).then(
              function (response) {
                console.log("created token")
              }
            ).catch(
              function (error) {
                console.log(error)
              }
            )
          }}/>
        </View>
      ),
    });
  }, [navigation]);


  const Tab = createMaterialTopTabNavigator();

  return(
    <Tab.Navigator
      screenOptions={{
        tabBarIndicatorStyle: { backgroundColor: '#6200EE' },
      }}
    >
      <Tab.Screen
        name="Pending"
        component={Pending}
        screenOptions={{
          unmountOnBlur: true,
          lazy: false
        }}
        initialParams={{userToken: route.params.userToken, data: route.params.data}}
      />
      <Tab.Screen
        name="History"
        component={History}
        screenOptions={{
          unmountOnBlur: true,
          lazy: false
        }}
        initialParams={{userToken: route.params.userToken, data: route.params.data}}
      />
    </Tab.Navigator>
  )

}

// Signin Screen
function SignIn({ navigation }) {
  const [emailText, setEmailText] = useState('');
  const [passText, setPassText] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [snackVisible, setSnackVisible] = useState(false);
  const onToggleSnackBar = () => setSnackVisible(!snackVisible);
  const onDismissSnackBar = () => setSnackVisible(false);

  const [modalVisible, setModalVisible] = useState(false);
  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);

  const [isLoading, setLoading] = useState(false);

  return (
    <View style={{flex: 1}}>
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
                getNotifs(response.data.token.token).then( r =>
                  navigation.navigate({name: "Home", params: {userToken: response.data.token.token, data: r}})
                )
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
          onPress={() => {
            showModal()
          }}
        >
          I don't have an account.
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
      <Provider>
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => {
              hideModal()
            }}
            contentContainerStyle={{backgroundColor: 'white', padding: 20, margin: 20}}
          >
            <Text>Access the admin website to create an account.</Text>
          </Modal>
        </Portal>
      </Provider>
    </View>
  );
}

// Base
export default function App() {

  const Stack = createNativeStackNavigator();

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="SignIn"
          component={SignIn}
          options={{
            title: 'Plate Recognizer',
            headerTitleStyle: {
              fontWeight: 'bold',
              color: '#6200EE',
            },
          }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={() => ({
            title: "Notifications",
            headerShadowVisible: false,
          })}
        />
      </Stack.Navigator>
      <StatusBar style="auto"/>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({

})