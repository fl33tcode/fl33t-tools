/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "AppDelegate.h"

#import <CoreLocation/CoreLocation.h>
#import <CoreBluetooth/CoreBluetooth.h>

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

#import "RNNordicDfu.h"
#import "BleManager.h"

@interface MyViewController : UIViewController <CBCentralManagerDelegate>
@property (nonatomic, strong) CLLocationManager *lm;
@property (nonatomic, strong) CBCentralManager *cm;
@end

@implementation MyViewController

- (void)viewDidAppear:(BOOL)animated
{
  self.lm = [[CLLocationManager alloc] init];
  [self.lm requestWhenInUseAuthorization];
  
  self.cm = [[CBCentralManager alloc] initWithDelegate:self queue:nil];
}

- (void)centralManagerDidUpdateState:(CBCentralManager *)central
{
  NSLog(@"did update state");
  if (central.state == CBCentralManagerStatePoweredOn) {
    [central scanForPeripheralsWithServices:nil options:nil];
  }
}
- (void)centralManager:(CBCentralManager *)central didDiscoverPeripheral:(CBPeripheral *)peripheral advertisementData:(NSDictionary<NSString *, id> *)advertisementData RSSI:(NSNumber *)RSSI;
{
  NSLog(@"did discover %@", peripheral.name);
}
@end
@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  NSLog(@"auth status: %d", [CLLocationManager authorizationStatus]);
  NSLog(@"fw zip: %@", [[NSBundle mainBundle] pathForResource:@"cadence-v3.1-0-gfbc9c07-app" ofType:@"zip"]);
 
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"fl33t_nrf52"
                                            initialProperties:nil];

  //UIView *rootView = [[UIView alloc] initWithFrame:[UIScreen mainScreen].bounds];
  //rootView.backgroundColor = [[UIColor alloc] initWithRed:0.0f green:1.0f blue:0.0f alpha:1];
  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  
  [RNNordicDfu setCentralManagerGetter:^() {
    return [BleManager getCentralManager];
  }];
  
  // Reset manager delegate since the Nordic DFU lib "steals" control over it
  [RNNordicDfu setOnDFUComplete:^() {
    NSLog(@"onDFUComplete");
    CBCentralManager * manager = [BleManager getCentralManager];
    manager.delegate = [BleManager getInstance];
  }];
  [RNNordicDfu setOnDFUError:^() {
    NSLog(@"onDFUError");
    CBCentralManager * manager = [BleManager getCentralManager];
    manager.delegate = [BleManager getInstance];
  }];
  
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  NSURL *jsCodeLocation = [NSURL URLWithString:@"http://10.0.1.8:8081/index.bundle?platform=ios&dev=true&minify=false"];
  //NSURL *jsCodeLocation = [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
  [[RCTBundleURLProvider sharedSettings] setJsLocation:jsCodeLocation.host];
  return jsCodeLocation;
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
