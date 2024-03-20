Home System Administration
===========================

Everything I need to remember about how to manage network systems at home.

Table of Contents
------------------

- [Network Administration](#network-administration)
  - [Devices](#devices)
  - [Troubleshooting](#troubleshooting)
  - [Network Admin Access](#network-admin-access)

Network Administration
-----------------------

### Devices

| Device | IP address | Router |
|--------|------------|--------|
| NETGEAR Nighthawk AX6 | 192.168.1.x | 192.168.1.1 |
| Luxul AC1200 Dual-Band Wireless Access Point | 192.168.0.x | 192.168.0.10 |

#### State Indicators

##### Luxul AC1200 Dual-Band Wireless Access Point

| Color | Activity | State |
|-------|----------|-------|
| 🟢 green | blinking | The device is rebooting |
| 🟢 green | solid | The device has booted and has a steady power supply |
| 🔵 blue | slow blinking | The device is establishing a network connection |
| 🔵 blue | solid | The device is broadcasting networks |
| 🔵 blue | rapid blinking | The device is detecting network activity |

### Troubleshooting

#### Can't Access Network Admin Portal For Luxul AC1200 Dual-Band Wireless Access Point

In some scenarios, you may be locked out of access to the network admin portal for Luxul AC1200 Dual-Band Wireless Access Point devices. The only remedy is a factory reset:

1. Unplug the device (The ethernet and power cable are the same).
2. Wait thirty seconds.
3. Plug the device.
4. Wait for the device to reboot; refer to [state indicators](#luxul-ac1200-dual-band-wireless-access-point).
5. Hold down the reset button.
6. Release the reset button when the only indicator is [a blinking green LED](#luxul-ac1200-dual-band-wireless-access-point).
7. Wait for the device to reboot; refer to [state indicators](#luxul-ac1200-dual-band-wireless-access-point).

You have successfully reset the device!

Refer to the default secrets for the device when [accessing the network admin portal](#network-admin-access).

### Network Admin Access

At a high level, accessing the network admin portal requires setting a static IP address, accessing the portal, and restoring Dynamic Host Configuration Protocol (DHCP).

#### Set A Static IP Address

1. Connect to a network broadcasted by the router.
2. Navigate to wifi settings (System Settings > Wifi).
3. Click the **Details...** button for the connected network; A dialog will appear.
4. Click the **TCP/IP** navigation option in the left dialog panel.
5. Select the **Manually** option of the **Configure IPv4** selector.
6. Change the **IP address** and **Router** inputs to values that correspond to [the device](#devices) you want to connect to.
7. Click the **OK** button.

#### Access The Portal

1. Open a private browser session.

> 🥸 **Note:** This is important to prevent accessing a cached version of the network admin portal.

2. Navigate to the network admin portal using the **Router** address you chose earlier.

> 🐌 **Note:** You should be prompted for credentials almost immediately. If you are not, and it doesn't appear you are getting a response from the device, and the device you're connecting to is the *Luxul AC1200 Dual-Band Wireless Access Point*, you may need to [perform a factory reset](#cant-access-network-admin-portal-for-luxul-ac1200-dual-band-wireless-access-point) on the device.

3. Refer to secrets and enter the credentials; you should be granted access to the network admin portal.
4. Backup configuration.
5. Perform maintenance.
6. Save changes.
7. Reboot the device to apply changes.

> 🛜 **Note:** When DHCP is enabled and applied to the *Luxul AC1200 Dual-Band Wireless Access Point*, you will be locked out of its network admin portal after the device reboots. [The only remedy](#cant-access-network-admin-portal-for-luxul-ac1200-dual-band-wireless-access-point) is to execute a factory reset on the device.

#### Restore DHCP

1. Navigate to wifi settings (System Settings > Wifi).
2. Click the **Details...** button for the connected network; A dialog will appear.
3. Click the **TCP/IP** navigation option in the left dialog panel.
4. Select the **Using DHCP** option of the **Configure IPv4** selector.
5. Click the **OK** button.
