import React, { useEffect, useState } from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import {
  RefreshControl,
  View,
  Text,
  FlatList,
  SafeAreaView,
  StyleSheet
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

function History({route, navigation}) {

  const userToken = route.params.userToken

  return(
    <View>
      <Text>{userToken}</Text>
    </View>
  )
}

function Pending({route, navigation}) {

  const userToken = route.params.userToken

//---------------------------- States ----------------------------//

  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = React.useCallback(() => {
    setPassText("")
    setRefreshing(true);
    getNotifs().then(() => setRefreshing(false));
  }, []);

  // Loading state
  const [isLoading, setLoading] = useState(false);

  // Data state
  const [data, setData] = useState([]);
  const pendingNotifs = () => {
    let notifs_ = []
    data.forEach((value) => {
      let diff = (Date.now() - new Date(`${value.created_at}`))
      diff = Math.floor((diff/1000)/60)
      if(diff <= 15){
        notifs_.push(value)
      }
    })
    return notifs_
  }
  const historyNotifs = () => {
    let notifs_ = []
    data.forEach((value) => {
      let diff = (Date.now() - new Date(`${value.created_at}`))
      diff = Math.floor((diff/1000)/60)
      if(diff > 15){
        notifs_.push(value)
      }
    })
    return notifs_
  }

  // Authentication state
  const [modalVisible, setModalVisible] = useState(false);
  const showModal = () => setModalVisible(true);
  const hideModal = () => setModalVisible(false);
  // Password field state
  const [passText, setPassText] = useState('');

  // Selected notification token
  const [currentToken, setCurrentToken] = useState();

//---------------------------- Coroutines ----------------------------//

  // Retrieve notifications
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
      setData(response.data.reverse())
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

//---------------------------- Renders ----------------------------//

  // Notification list item
  const PendingItem = ({item}) => (
    <TouchableRipple onPress={() => {
      setCurrentToken(item)
      showModal()
    }}>
      <List.Item
        title={item.message}
        description={item.created_at}
        left={props => <List.Icon {...props} icon="alert"/>}
      />
    </TouchableRipple>
  );
  const HistoryItem = ({item}) => (
    <List.Item
      title={item.message}
      description={item.created_at}
    />
  );

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton icon="refresh" onPress={() => {navigation.navigate({name: "Home", params: {item: userToken}})}} />
      ),
    });
  }, [navigation]);

  return (
    <Provider>
      {isLoading ? <ActivityIndicator/> : (
        <List.Section>
          { pendingNotifs().length > 0 ? (
            <List.Subheader>Pending Notifications</List.Subheader>
          ) : (
            <List.Item title="No pending notifications"/>
          ) }
          <FlatList
            data={pendingNotifs()}
            renderItem={PendingItem}
            keyExtractor={item => item.id}/>

          <List.Subheader>History</List.Subheader>
          <FlatList
            data={historyNotifs()}
            renderItem={HistoryItem}
            keyExtractor={item => item.id}
          />

        </List.Section>
      )}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={() => {
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
  )
}

// Home Screen
function Home({route, navigation}) {

  // User's token
  const userToken = route.params.item

  const Tab = createMaterialTopTabNavigator();

  return(
    <Tab.Navigator>
      <Tab.Screen name="Pending" component={Pending} initialParams={{userToken: userToken}} />
      <Tab.Screen name="History" component={History} initialParams={{userToken: userToken}}/>
    </Tab.Navigator>
  )

}

// Signin Screen
function SignIn({ navigation }) {
  const [emailText, setEmailText] = useState('miguelleirosa@gmail.com');
  const [passText, setPassText] = useState('migascl');

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
        <Stack.Screen name="SignIn" component={SignIn} options={{ title: 'Plate Recognizer' }}/>
        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            title: "Notifications",
            headerShadowVisible: false
        }}/>
      </Stack.Navigator>
      <StatusBar style="auto"/>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({

})