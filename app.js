(function() {

  'use_strict';

  return {
    requests: {
      fetchAudits: function() {
        return {
          url: helpers.fmt(
            '/api/v2/tickets/%@/audits.json?include=users',
            this.ticket().id()
          )
        };
      }
    },

    events: {
      'app.activated'           : 'onAppActivated',
      'app.deactivated'         : 'onAppFocusOut',
      'app.willDestroy'         : 'onAppWillDestroy',
      'ticket.save'             : 'onTicketSave',
      'ticket.form.id.changed'  : 'onTicketFormChanged',
      'fetchAudits.done'        : 'onFetchAuditsDone',
      'click .pause'            : 'onPauseClicked',
      'click .resume'           : 'onResumeClicked',
      'click .reset'            : 'onResetClicked',
      'click .modal-save'       : 'onModalSaveClicked',
      'click a.timelogs-opener:not([disabled])'  : 'onTimeLogsContainerClicked',
      'shown .modal'            : 'onModalShown',
      'hidden .modal'           : 'onModalHidden'
    },

    /*
     *
     *  EVENT CALLBACKS
     *
     */
    onAppActivated: function(app) {
      if (app.firstLoad) {
        _.defer(this.initialize.bind(this));

        if (this.ticket().id() && this.setting('display_timelogs')) {
          this.ajax('fetchAudits');
        }
      } else {
        this.onAppFocusIn();
      }
    },

    onAppWillDestroy: function() {
      clearInterval(this.timeLoopID);
    },

    onAppFocusOut: function() {
      if (this.setting('auto_pause_resume')) {
        this.autoPause();
      }
    },

    onAppFocusIn: function() {
      if (this.setting('auto_pause_resume') &&
         !this.manuallyPaused) {
        this.autoResume();
      }
    },

    onTicketFormChanged: function() {
      _.defer(this.hideFields.bind(this));
    },

    onTicketSave: function() {
      if (this.setting('time_submission')) {
        return this.promise(function(done, fail) {
          this.saveHookPromiseDone = done;
          this.saveHookPromiseFail = fail;

          this.renderTimeModal();
        }.bind(this));
      } else {
        this.updateTime(this.elapsedTime);

        return true;
      }
    },

    onFetchAuditsDone: function(data) {
      var timelogs = _.reduce(data.audits, function(memo, audit) {
        var event = _.find(audit.events, function(event) {
          return event.field_name == this.setting('time_field_id');
        }, this);

        if (event) {
          memo.push({
            time: this.TimeHelper.secondsToTimeString(parseInt(event.value, 0)),
            date: new Date(audit.created_at).toLocaleString(),
            user: _.find(data.users, function(user) {
              return user.id === audit.author_id;
            })
          });
        }

        return memo;
      }, [], this);

      this.renderTimelogs(timelogs.reverse());
    },

    onPauseClicked: function(e) {
      var $el = this.$(e.currentTarget);

      $el.removeClass('pause').addClass('resume');
      $el.find('i').prop('class', 'icon-play');

      this.manuallyPaused = this.paused = true;
    },

    onResumeClicked: function(e) {
      var $el = this.$(e.currentTarget);

      $el.removeClass('resume').addClass('pause');
      $el.find('i').prop('class', 'icon-pause');

      this.manuallyPaused = this.paused = false;
    },

    onResetClicked: function() {
      this.elapsedTime = 0;
    },

    onTimeLogsContainerClicked: function(e) {
      var $el = this.$(e.currentTarget);

      if (!this.$('.timelogs-container').is(':visible')) {
        $el.addClass('active');
        this.$('.timelogs-container').show();
      } else {
        $el.removeClass('active');
        this.$('.timelogs-container').hide();
      }
    },

    onModalSaveClicked: function() {
      var timeString = this.$('.modal-time').val();

      try {
        this.updateTime(this.TimeHelper.timeStringToSeconds(timeString));
        this.saveHookPromiseIsDone = true; // Flag that saveHookPromiseDone is gonna be called after hiding the modal
        this.$('.modal').modal('hide');
        this.saveHookPromiseDone();
      } catch (e) {
        if (e.message == 'bad_time_format') {
          services.notify(this.I18n.t('errors.bad_time_format'), alert);
        } else {
          throw e;
        }
      }
    },

    onModalShown: function() {
      var timeout = 15,
          $timeout = this.$('span.modal-timer'),
          $modal = this.$('.modal');

      this.modalTimeoutID = setInterval(function() {
        timeout -= 1;

        $timeout.html(timeout);

        if (timeout === 0) {
          $modal.modal('hide');
        }
      }.bind(this), 1000);
    },

    onModalHidden: function() {
      clearInterval(this.modalTimeoutID);

      if (!this.saveHookPromiseIsDone) {
        this.saveHookPromiseFail(this.I18n.t('errors.save_hook'));
      }
    },

    /*
     *
     * METHODS
     *
     */

    initialize: function() {
      this.hideFields();

      this.timeLoopID = this.setTimeLoop();

      this.switchTo('main', {
        manual_pause_resume: this.setting('manual_pause_resume'),
        display_reset: this.setting('reset'),
        display_timer: this.setting('display_timer')
      });

      this.$('tr').tooltip({ placement: 'left', html: true });
    },

    updateMainView: function(time) {
      this.$('.live-timer').html(this.TimeHelper.secondsToTimeString(time));
      this.$('.live-totaltimer').html(this.TimeHelper.secondsToTimeString(
        this.totalTime() + time
      ));
    },

    renderTimelogs: function(timelogs) {
      this.$('.timelogs-container')
        .html(this.renderTemplate('timelogs', {
          timelogs: timelogs,
          csv_filename: helpers.fmt('ticket-timelogs-%@',
                                    this.ticket().id()),
          csv_string: encodeURI(this.timelogsToCsvString(timelogs))

        }));

      this.$('.timelogs-opener')
        .removeAttr('disabled')
        .removeClass('disabled');
    },

    hideFields: function() {
      _.each([this.timeFieldLabel(), this.totalTimeFieldLabel()], function(f) {
        var field = this.ticketFields(f);

        if (field) {
          field.hide();
        }
      }, this);
    },

    /*
     * TIME RELATED
     */

    setTimeLoop: function() {
      this.elapsedTime = 0;

      return setInterval(function() {
        if (!this.paused) {
          // Update elapsed time by 1 second
          this.elapsedTime += 1;

          this.updateMainView(this.elapsedTime);
        }
      }.bind(this), 1000);
    },

    updateTime: function(time) {
      this.time(time);
      this.totalTime(this.totalTime() + time);
    },

    autoResume: function() {
      this.paused = false;
    },

    autoPause: function() {
      this.paused = true;
    },

    renderTimeModal: function() {
      this.$('.modal-time').val(this.TimeHelper.secondsToTimeString(this.elapsedTime));
      this.$('.modal').modal('show');
    },

    /*
     *
     * HELPERS
     *
     */

    time: function(time) {
      return this.getOrSetField(this.timeFieldLabel(), time);
    },

    totalTime: function(time) {
      return this.getOrSetField(this.totalTimeFieldLabel(), time);
    },

    totalTimeFieldLabel: function() {
      return this.buidFieldLabel(this.setting('total_time_field_id'));
    },

    timeFieldLabel: function() {
      return this.buidFieldLabel(this.setting('time_field_id'));
    },

    buidFieldLabel: function(id) {
      return helpers.fmt('custom_field_%@', id);
    },

    getOrSetField: function(fieldLabel, value) {
      if (value) {
        return this.ticket().customField(fieldLabel, value);
      }

      return parseInt((this.ticket().customField(fieldLabel) || 0), 0);
    },

    timelogsToCsvString: function(timelogs) {
      return _.reduce(timelogs, function(memo, timelog) {
        return memo + helpers.fmt('%@\n', [ timelog.time, timelog.user.name, timelog.date].join());
      }, 'Time,Submitter,Submitted At\n', this);
    },

    TimeHelper: {
      secondsToTimeString: function(seconds) {
        var hours   = Math.floor(seconds / 3600),
            minutes = Math.floor((seconds - (hours * 3600)) / 60);
            secs    = seconds - (hours * 3600) - (minutes * 60);

        return helpers.fmt('%@:%@:%@',
                           this.addInsignificantZero(hours),
                           this.addInsignificantZero(minutes),
                           this.addInsignificantZero(secs));
      },

      timeStringToSeconds: function(timeString) {
        var re = /^([\d]{2}):([\d]{2}):([\d]{2})$/,
            result = re.exec(timeString);

        if (!result ||
            result.length != 4) {
          throw { message: 'bad_time_format' };
        } else {
          return (parseInt(result[1], 10) * 3600) +
            (parseInt(result[2], 10) * 60) +
            (parseInt(result[3], 10));
        }
      },

      addInsignificantZero: function(n) {
        return ( n < 10 ? '0' : '') + n;
      }
    }
  };
}());
