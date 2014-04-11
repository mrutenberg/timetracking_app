:warning: *Use of this software is subject to important terms and conditions as set forth in the License file* :warning:

# Time Tracking App

## Description:

Helps you track time on your tickets. You'll be able to submit custom time and restrict time submission.

## App location:

* Ticket sidebar
* New Ticket sidebar

## Features:

* Track current spent time on a ticket.
* Track total spent time on a ticket.
* Ability to select in which unit to report the total time spent (milliseconds, seconds, minutes).
* Log every time submission (time submitted, agent name, status submitted, submission date). *Can be turned off*.
* Download time logs as a csv file.
* Ability to auto-pause/resume the timer when the agent isn't focused on the ticket. *Can be turned off*.
* Ability for the agent to manually pause/resume the timer. *Can be turned off*.
* Ability for the agent to restart the timer. *Can be turned off*.
* Ability for the agent to submit his own spent time. *Can be turned off*.

## Set-up/installation instructions:

You will need to create 2 ticket fields:
* A Numeric ticket field that will contain the total time spent (used to report on GoodData).
* A Multi-line text ticket field that will store the app configuration and time logs.

After installation, on the app settings page:
* Put the previously create Numeric ticket field ID in the "Time Field ID" setting.
* Put the previously create Multi-line ticket field ID in the "Config Field ID" setting.
* Enable/Disable settings to customise as you need it.

## Contribution:

Pull requests are welcome.

## Screenshot(s):

Default view of the app:

![](http://i.imgur.com/V1x1coZ.png)

