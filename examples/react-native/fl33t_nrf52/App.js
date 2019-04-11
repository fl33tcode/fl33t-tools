/**
 * Example app: using fl33t with an nr52
 *
 */

import React, { Component } from 'react';
import {
    AsyncStorage,
    NativeModules,
    NativeEventEmitter,
    Text,
    FlatList,
    SectionList,
    TouchableHighlight,
    View } from 'react-native';
import {createStackNavigator, createAppContainer} from 'react-navigation';
import { ListItem } from 'react-native-elements';
import { NordicDFU, DFUEmitter } from "react-native-nordic-dfu";
import BleManager from "react-native-ble-manager";
import RNFetchBlob from "react-native-fetch-blob";
import fl33t from "@fl33t/client";
import config from "./config";

const FB = RNFetchBlob.config({
  fileCache: true,
  appendExt: "zip"
});

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

class DeviceListScreen extends Component {
  static navigationOptions = {
    title: 'Choose a Device',
  };
  constructor(props) {
      super(props);
      this.state = {
          peripherals: [],
      };
  }
  componentDidMount() {

    BleManager.start({ showAlert: false })
      .then(() => { console.log("BleManager module initialized"); });
    bleManagerEmitter.addListener("BleManagerStopScan", () => {
      console.log("stop scan");
    });
    bleManagerEmitter.addListener("BleManagerDidUpdateState",
        (args) => {
            if (args.state === "on") {
                BleManager.scan([], 5, true).then(results => {
                  console.log("Scanning...");
                });
            }
        });
    bleManagerEmitter.addListener("BleManagerDiscoverPeripheral",
        (args) => {
            const p = this.state.peripherals.find((elem) => { return elem.id === args.id; });
            if (p === undefined && args.name) {
                let ps = this.state.peripherals;
                ps.push(args);
                this.setState({peripherals: ps});
            }
        });
  }
  render() {
    let peripherals = this.state.peripherals.map((p) => { return {id: p.id, name: p.name, rssi: p.rssi}; });
    peripherals.sort((p1, p2) => p2.rssi - p1.rssi);
    return (
      <View>
        <FlatList
          data={peripherals}
          renderItem={({item}) => <TouchableHighlight onPress={() => this.props.navigation.push('BuildTrains', {device: item})}><ListItem title={item.name} subtitle={item.rssi} bottomDivider chevron /></TouchableHighlight>}
          keyExtractor={p => p.id}
        />
      </View>
    );
  }
}

class BuildTrainsScreen extends Component {
  static navigationOptions = {
    title: 'Start an Update',
  };
  constructor(props) {
      super(props);
      this.state = {
          trains: [],
      };
      this.fl33t = new fl33t(config.sessionToken, config.teamId);
  }
  componentDidMount() {
      this.fl33t.getTrains().then((result) => {
          this.setState(result);
      });
  }
  render() {
    const device = this.props.navigation.getParam('device');
    return (
      <View>
        <SectionList
          renderItem={({item, index, section}) => {
              if (section.title == 'Check for Updates') {
                return <TouchableHighlight onPress={() => this.props.navigation.push('Updating', {device: device})}><ListItem title={item.name} bottomDivider chevron /></TouchableHighlight>;
              }
              else {
                return <TouchableHighlight onPress={() => this.props.navigation.push('Builds', {device: device, train: item})}><ListItem title={item.name} bottomDivider chevron /></TouchableHighlight>;
              }
          }}
          renderSectionHeader={({section: {title}}) => (
            <ListItem titleStyle={{fontWeight: 'bold'}} title={title} />
          )}
          sections={[
            {title: 'Check for Updates', data: [{train_id: 'none', name: 'Check Now'}]},
            {title: 'Choose a Build Train', data: this.state.trains},
          ]}
          keyExtractor={(item) => item.train_id}
        />
      </View>
    );
  }
}

class BuildsScreen extends Component {
  static navigationOptions = {
    title: 'Choose a Build',
  };
  constructor(props) {
      super(props);
      this.state = {
          builds: [],
      };
      this.fl33t = new fl33t(config.sessionToken, config.teamId);
  }
  componentDidMount() {
      const train = this.props.navigation.getParam('train');
      this.fl33t.getBuilds(train.train_id, {limit: 50}).then((result) => {
          this.setState(result);
      });
  }
  render() {
    const device = this.props.navigation.getParam('device');
    return (
      <View>
        <FlatList
          data={this.state.builds}
          renderItem={({item}) => <TouchableHighlight onPress={() => this.props.navigation.push('Updating', {device: device, build: item})}><ListItem title={item.version} bottomDivider chevron /></TouchableHighlight>}
          keyExtractor={b => b.build_id}
        />
      </View>
    );
  }
}

class UpdatingScreen extends Component {
  static navigationOptions = {
    title: 'Updating...',
  };
  constructor(props) {
      super(props);
      this.phases = [
          { type: "checking_in", title: "Checking for update...", progress: () => 0 },
          { type: "downloading", title: "Downloading...", progress: () => this.state.downloadProgress },
          { type: "connecting", title: "Connecting...", progress: () => 0 },
          { type: "begin_dfu", title: "Begin DFU...", progress: () => 0 },
          { type: "enabling_dfu", title: "Enabling DFU mode...", progress: () => 0 },
          { type: "starting_dfu", title: "Starting DFU...", progress: () => 0 },
          { type: "uploading", title: "Uploading...", progress: () => this.state.uploadProgress },
          { type: "disconnecting", title: "Disconnecting...", progress: () => 0 },
          { type: "completed", title: "Completed!", progress: () => 0 }
      ];
      this.state = {
          buildId: "",
          currentPhase: 0,
          downloadProgress: 0,
          filePath: "",
          uploadProgress: 0
      };

  }
  setPhase(type) {
      const idx = this.phases.findIndex((p) => p.type === type);
      this.setState({currentPhase: idx});
  }
  checkForUpdate() {
      AsyncStorage.getItem("buildId").then((buildId) => {
          let fl33tclient = new fl33t(config.sessionToken, config.teamId);
          fl33tclient.checkin(config.deviceId, buildId).then((resp) => {
              if (resp && resp.build) {
                  this.installBuild(resp.build);
              }
              else {
                  this.setPhase("completed");
              }
          });
      });
  }
  installBuild(build) {
    this.setPhase("downloading");
    this.setState({buildId: build.build_id});
    FB.fetch("GET", build.download_url).then(file => {
      console.log("file saved to", file.path());
      const device = this.props.navigation.getParam('device');
      console.log("Starting DFU to: ", device);
      NordicDFU.startDFU({
        deviceAddress: device.id,
        deviceName: device.name,
        filePath: file.path()
      })
        .progress((received, total) => { this.setState({ downloadProgress: (received / total) }); })
        .then(res => console.log("DFU complete: ", res))
        .catch(console.log)
        .finally(() => { file.flush(); }); // delete the firmware file
    });
  }
  componentDidMount() {
    DFUEmitter.addListener("DFUProgress", ({ percent }) => {
      console.log("DFU progress:", percent);
      this.setState({uploadProgress: percent/100.0});
    });
    DFUEmitter.addListener("DFUStateChanged", ({ state }) => {
      const phase = this.phases[this.state.currentPhase];
      console.log("DFU state:", state);
      if (state === "CONNECTING") {
          this.setPhase("connecting");
      }
      else if (phase.type === "connecting" && state === "DFU_PROCESS_STARTING") {
          this.setPhase("begin_dfu");
      }
      else if (state === "ENABLING_DFU_MODE") {
          this.setPhase("enabling_dfu");
      }
      else if (phase.type === "enabling_dfu" && state === "DFU_PROCESS_STARTING") {
          this.setPhase("starting_dfu");
      }
      else if (state === "DFU_STATE_UPLOADING") {
          this.setPhase("uploading");
      }
      else if (state === "DEVICE_DISCONNECTING") {
          this.setPhase("disconnecting");
      }
      else if (state === "DFU_COMPLETED") {
          this.setPhase("completed");
          AsyncStorage.setItem("buildId", this.state.buildId);
      }
    });

    const build = this.props.navigation.getParam('build');
    if (build) {
        this.installBuild(build);
    }
    else {
        this.checkForUpdate();
    }
  }
  render() {
    const phase = this.phases[this.state.currentPhase];
    const progressPerPhase = 100 / (this.phases.length - 1);
    let currentProgress = this.state.currentPhase * progressPerPhase;
    currentProgress += progressPerPhase * phase.progress();
    return (
      <View style={{marginTop: 50, textAlign: "center"}}>
        <Text style={{ marginLeft: 10, fontSize: 24}}>{phase.title}</Text>
        <View style={{
            backgroundColor: "#62defd",
            height: 20,
            width: currentProgress.toFixed(0) + "%",
            marginTop: 20,
        }} />
      </View>
    );
  }
}

const MainNavigator = createStackNavigator({
  DeviceList: {screen: DeviceListScreen},
  BuildTrains: {screen: BuildTrainsScreen},
  Builds: {screen: BuildsScreen},
  Updating: {screen: UpdatingScreen}
});

const App = createAppContainer(MainNavigator);

export default App;
