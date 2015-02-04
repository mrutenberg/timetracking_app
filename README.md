:warning: *Use of this software is subject to important terms and conditions as set forth in the License file* :warning:

Zendesk Time Tracking app
===============

From the [Help Center article](https://support.zendesk.com/hc/en-us/articles/203691196-Using-the-Time-Tracking-app-Plus-and-Enterprise-):

>    “The Time Tracking app enables you to monitor how much time you spend on tickets.”

It looks like this:

![Timetracking App main interface](http://zen-marketing-documentation.s3.amazonaws.com/docs/en/time-tracking-timer-controls.png)

It also allows admins (and optionally agents) to review the logs:

![TT app review screen](http://zen-marketing-documentation.s3.amazonaws.com/docs/en/time-tracking-timelogs.png)

It also lets people edit their “time spent” before they submit a ticket.

There are a whole bunch of settings, which are [documented in Help Center](https://support.zendesk.com/hc/en-us/articles/203662506-Setting-up-the-Time-Tracking-app-Plus-and-Enterprise-):

![TT settings](https://www.evernote.com/shard/s162/sh/a5cd5e63-34cb-4197-a9af-9bb76de727f9/bfc6b57fe98b5e6b6f09588f00e2d4f1/deep/0/a_-_Agent.png)

## Implementation

From a [Help Center article about setting up the app](https://support.zendesk.com/hc/en-us/articles/203662506-Setting-up-the-Time-Tracking-app-Plus-and-Enterprise-#topic_vdh_vs2_44):

>   “When you install Time Tracking, it automatically creates two custom ticket fields, Time spent since last update and Total time spent.”

When the ticket is submitted, the time tracking app sets the “time spent since last update” field to whatever has been timed by the app, and then sets the “total time spent” field to the previous value of that field plus the “time spent since last update” field.


## Contributing

Pull requests and bug reports are very welcome :heart:
