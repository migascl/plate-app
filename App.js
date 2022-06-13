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
  IconButton,
  Dialog,
  Caption
} from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import axios from "axios";

const baseUrl = 'https://plate-notifications.herokuapp.com' // Notification API URL

// Prefilled variables for testing
const testEmail = ''
const testPassword = ''
const testPlate = 'H391DVSA'

function refreshHome({navigation, route}) {
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
  })
}

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
        title={`License plate ${item.message}`}
        description={ `${new Date(Date.parse(item.created_at)).toUTCString()}`}
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

  const [errorMsg, setErrorMsg] = useState(''); // Snack message state
  const [snackVisible, setSnackVisible] = useState(false); // Snack visibility state
  const onToggleSnackBar = () => setSnackVisible(!snackVisible); // OnToggleSnack function
  const onDismissSnackBar = () => setSnackVisible(false); // OnDismissSnack function

  // Authentication state
  const [modalVisible, setModalVisible] = useState(false);
  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);
  // Password field state
  const [passText, setPassText] = useState('');

  // Selected notification token
  const [currentToken, setCurrentToken] = useState([]);

  const [isLoading, setLoading] = useState(false); // Loading state

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
        setCurrentToken(item)
        showModal()
      }}
    >
    <List.Item
      title={`${new Date(Date.parse(item.created_at)).toUTCString()}`}
      description={"Tap to authenticate."}
      left={props => <List.Icon {...props} icon="alert" color="#6200EE"/>}
    />
    </TouchableRipple>
  );

  return (
    <Provider>
      { data().length <= 0 ? (
        <List.Item title="No pending notifications"/>
      ) : (
        <></>
      ) }
      <FlatList
        data={data()}
        renderItem={Item}
        keyExtractor={item => item.id}
      />
      <Portal>
        <Dialog
          visible={modalVisible}
          onDismiss={() => {
            hideModal()
          }}
          contentContainerStyle={{backgroundColor: 'white', padding: 20, margin: 20}}
        >
          <Dialog.Content>
            <Caption>License plate: {currentToken.message}</Caption>
            <Caption>Detected at: {new Date(Date.parse(currentToken.created_at)).toUTCString()}</Caption>
            <Text
              style={{
                marginVertical: 6,
              }}
            >Type password to confirm:</Text>
            <TextInput
              label="Password"
              style={{
                marginVertical: 6,
              }}
              secureTextEntry={true}
              value={passText}
              onChangeText={passText => setPassText(passText)}
            />
            <Button
              mode="contained"
              style={{
                marginVertical: 6,
              }}
              loading={isLoading}
              disabled={isLoading}
              onPress={() => {
                console.log("attempting auth:")
                console.log("route.params.userToken: " + route.params.userToken)
                console.log("passText: " + passText)
                console.log("currentToken: " + currentToken)

                axios.post(
                  `${baseUrl}/authenticate-token`,
                  {
                    password: `${passText}`,
                    token: `${currentToken.token}`,
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${route.params.userToken}`,
                    }
                  }
                ).then( // If successful
                  function (response) {
                    refreshHome({navigation, route})
                    hideModal()
                  }
                ).catch( // If fails
                  function (error) {
                    console.log(error)
                    setErrorMsg(`An error has occurred. (Error code: ${error.response.status})`)
                    onToggleSnackBar()
                  }
                )
                setLoading(false)
                setPassText("")
              }}
            >
              Confirm
            </Button>
          </Dialog.Content>
        </Dialog>
        <Snackbar
          visible={snackVisible}
          onDismiss={() => {
            onDismissSnackBar()
            setErrorMsg("")
          }}
        >
          {errorMsg}
        </Snackbar>
      </Portal>
    </Provider>
  )
}

// Home Screen
function Home({route, navigation}) {

  console.log("home")

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
              refreshHome({navigation, route})
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
    <>
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
    </>
  )

}

// Signin Screen
function SignIn({ navigation }) {

  const [emailText, setEmailText] = useState('miguelleirosa@gmail.com'); // Email field state
  const [passText, setPassText] = useState('migascl'); // Password field state

  const [errorMsg, setErrorMsg] = useState(''); // Snack message state
  const [snackVisible, setSnackVisible] = useState(false); // Snack visibility state
  const onToggleSnackBar = () => setSnackVisible(!snackVisible); // OnToggleSnack function
  const onDismissSnackBar = () => setSnackVisible(false); // OnDismissSnack function

  const [modalVisible, setModalVisible] = useState(false); // Modal visibility state
  const showModal = () => setModalVisible(true); // Show modal function
  const hideModal = () => setModalVisible(false); // Hide modal function

  const [isLoading, setLoading] = useState(false); // Loading state

  return (
    <SafeAreaView style={{
      flex: 1,
    }}>
      <View style={{
        padding: 24,
      }}>
        <TextInput
          label="Email"
          value={emailText}
          onChangeText={emailText => setEmailText(emailText)}
          style={{
            marginVertical: 6,
          }}
        />
        <TextInput
          label="Password"
          secureTextEntry={true}
          value={passText}
          onChangeText={passText => setPassText(passText)}
          style={{
            marginVertical: 6,
          }}
        />
        <Button
          mode="contained"
          style={{
            marginVertical: 12,
          }}
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
                // Retrieve notifications from user token and open notification page with retrieved data
                getNotifs(response.data.token.token).then( r =>
                  navigation.navigate({
                    name: "Home",
                    params: {
                      userToken: response.data.token.token,
                      data: r
                    }
                  })
                )
                setLoading(false)
              }
            ).catch( // If fails
              function (error) {
                console.log(error)
                setErrorMsg(`An error has occurred, check your credentials. \n(Error code: ${error.response.status})`)
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
      </View>
      <Snackbar
        visible={snackVisible}
        onDismiss={() => {
          onDismissSnackBar()
          setErrorMsg("")
        }}
      >
        {errorMsg}
      </Snackbar>
      <Provider>
        <Portal>
          <Dialog
            visible={modalVisible}
            onDismiss={() => {
              hideModal()
            }}
            contentContainerStyle={{backgroundColor: 'white', padding: 20, margin: 20}}
          >
            <Dialog.Content>
              <Text>Access the admin website to create an account:</Text>
              <Text>plate-administrator.herokuapp.com</Text>
            </Dialog.Content>
          </Dialog>
        </Portal>
      </Provider>
    </SafeAreaView>
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