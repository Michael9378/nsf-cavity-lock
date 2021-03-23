  // Settings which can be modified

  var app_id = 'cavity-locker';
  var root_url = '';
  //var root_url = 'http://10.0.1.221';      // Test local
  //var root_url = 'http://192.168.53.133';  // Test remote and local
  //var root_url = 'http://192.168.1.100';   // Default RedPitaya IP

  var app_version = '0.1.1-3-devbuild_RELOAD';
  var start_app_url = root_url + '/bazaar?start=' + app_id;
  var stop_app_url = root_url + '/bazaar?stop=';
  var get_url = root_url + '/data';
  var post_url = root_url + '/data';
  var upload_url = root_url + '/upload_gen_ch';  // The channel number is added automatically

  var update_interval = 50;              // Update interval for PC, milliseconds
  var update_interval_mobdev = 500;      // Update interval for mobile devices, milliseconds
  var request_timeout = 3000;            // Milliseconds
  var long_timeout = 20000;              // Milliseconds
  var meas_panel_dec = 5;                // Decimation for numerical measure panel to make it human readable
  var meas_panel_dec_mobdev = 1;         // Decimation for numerical measure panel for mobile devices
  var points_per_px = 5;                 // How many points per pixel should be drawn. Set null for unlimited (will disable client side decimation).
  var xdecimal_places = 2;               // Number of decimal places for the xmin/xmax values. Maximum supported are 12.
  var trigger_level_xdecimal_places = 4; // Number of decimal places for trigger level tooltip
  var range_offset = 1;                  // Percentages

  var xmin = -1000000;
  var xmax = 1000000;

  var time_range_max = [130, 1000, 8, 130, 1, 8];
  var range_steps = [0.5, 1, 2, 5, 10, 20, 50, 100];

  var plot_options = {
    colors: ['#3276B1', '#D2322D', '#009900'],    // channel1, channel2, trigger line
    lines: { lineWidth: 1 },
    selection: { mode: 'xy' },
    zoom: { interactive: true, trigger: null },
    xaxis: { min: xmin, max: xmax },
    grid: { borderWidth: 0 , hoverable: true, clickable: true },
    legend: { noColumns: 2, margin: [0, 0], backgroundColor: 'transparent' },
    touch: { autoWidth: false, autoHeight: false }
  };

  // Settings which should not be modified

  var update_timer = null;
  var zoompan_timer = null;
  var downloading = false;
  var scope_stop = false;
  var sending = false;
  var send_que = false;
  var use_long_timeout = false;
  var trig_dragging = false;
  var touch_last_y = 0;
  var user_editing = false;
  var app_started = false;
  var last_get_failed = false;
  var refresh_counter = 0;
  var autorun = 1;
  var datasets = [];
  var plot = null;
  var params = {
    original: null,
    local: null
  };

  load_config_block_start=1;

  set_trigger_val=false;
  trigger_just_set=false;
  last_disp_units=false;
  lasttsp=Math.floor((new Date().getTime())/1000);

  // List of params to save/load
  config_params_txts = 'xmin,xmax,trig_mode,trig_source,trig_edge,trig_delay,trig_level,time_range,time_units,en_avg_at_dec,min_y,'+
                       'max_y,prb_att_ch1,gain_ch1,prb_att_ch2,gain_ch2,gui_xmin,gui_xmax,'+
                       'lock_oscA_sw,lock_oscB_sw,lock_osc1_filt_off,lock_osc2_filt_off,lock_osc_raw_mode,lock_osc_lockin_mode,lock_trig_sw,'+
                       'lock_out1_sw,lock_out2_sw,lock_slow_out1_sw,lock_slow_out2_sw,lock_slow_out3_sw,lock_slow_out4_sw,lock_lock_control,'+
                       'lock_lock_trig_val,lock_lock_trig_time_val,lock_lock_trig_sw,lock_rl_error_threshold,lock_rl_signal_sw,lock_rl_signal_threshold,'+
                       'lock_rl_error_enable,lock_rl_signal_enable,lock_rl_reset,lock_sf_jumpA,lock_sf_jumpB,lock_sf_start,lock_sf_AfrzO,'+
                       'lock_sf_AfrzI,lock_sf_BfrzO,lock_sf_BfrzI,lock_signal_sw,lock_sg_amp1,lock_sg_amp2,lock_sg_amp3,lock_sg_amp_sq,'+
                       'lock_lpf_F1_tau,lock_lpf_F1_order,lock_lpf_F2_tau,lock_lpf_F2_order,lock_lpf_F3_tau,lock_lpf_F3_order,lock_lpf_sq_tau,'+
                       'lock_lpf_sq_order,lock_error_sw,lock_error_offset,lock_gen_mod_phase,lock_gen_mod_phase_sq,lock_gen_mod_hp,lock_gen_mod_sqp,'+
                       'lock_ramp_step,lock_ramp_low_lim,lock_ramp_hig_lim,lock_ramp_reset,lock_ramp_enable,lock_ramp_direction,lock_ramp_B_factor,'+
                       'lock_read_ctrl,lock_pidA_sw,lock_pidA_PSR,lock_pidA_ISR,lock_pidA_DSR,lock_pidA_SAT,lock_pidA_sp,lock_pidA_kp,'+
                       'lock_pidA_ki,lock_pidA_kd,lock_pidA_irst,lock_pidA_freeze,lock_pidA_ifreeze,lock_pidB_sw,lock_pidB_PSR,lock_pidB_ISR,'+
                       'lock_pidB_DSR,lock_pidB_SAT,lock_pidB_sp,lock_pidB_kp,lock_pidB_ki,lock_pidB_kd,lock_pidB_irst,lock_pidB_freeze,'+
                       'lock_pidB_ifreeze,lock_aux_A,lock_aux_B,lock_ctrl_aux_lock_now,lock_ctrl_aux_launch_lock_trig,lock_ctrl_aux_pidB_enable_ctrl,'+
                       'lock_ctrl_aux_pidA_enable_ctrl,lock_ctrl_aux_ramp_enable_ctrl,lock_ctrl_aux_set_pidB_enable,lock_ctrl_aux_set_pidA_enable,'+
                       'lock_ctrl_aux_set_ramp_enable,lock_ctrl_aux_trig_type,lock_ctrl_aux_lock_trig_rise,lock_mod_sq_on,lock_mod_harmonic_on';

  config_params_keys = config_params_txts.split(",");

  text_param_editor='';

  // Default parameters - posted after server side app is started
  var def_params = {
    en_avg_at_dec: 0
  };

  // On page loaded

  $(function() {

    // Show different buttons on touch screens
    if(window.ontouchstart === undefined) {
      $('.btn-lg').removeClass('btn-lg');
      $('#accordion    .btn, .modal .btn').addClass('btn-sm');
      // LOLO -------
      $('#bottom_panel .btn, .modal .btn').addClass('btn-sm');
      $('#leftpanel    .btn, .modal .btn').addClass('btn-sm');
      // end -------

      $('#btn_zoompan').remove();
      $('#btn_zoomin, #btn_zoomout, #btn_pan').show();
    }
    else {
      update_interval = update_interval_mobdev;
      meas_panel_dec = meas_panel_dec_mobdev;
      $('#btn_zoomin, #btn_zoomout, #btn_pan').remove();
      $('#btn_zoompan').show();
    }

    // Add application ID in the message from modal popup
    $('.app-id').text(app_id);

    // Disable all controls until the params state is loaded for the first time
    $('input, select, button', '.container').prop('disabled', true);

    // Events binding for trigger controls

    $('#trigger_canvas').on({
      'mousedown touchstart': function(evt) {

        // Ignore the event if trigger source is External or mode is not Normal
        if(!params.original || params.original.trig_mode != 1 || params.original.trig_source == 2) {
          return;
        }

        trig_dragging = true;
        $('input, select', '#accordion').blur();
        $('input, select', '#bottom_panel').blur();    //LOLO
        $('input, select', '#leftpanel').blur();  //LOLO
        mouseDownMove(this, evt);
        evt.preventDefault();
        return false;
      },
      'mousemove touchmove': function(evt) {
        if(! trig_dragging) {
          return;
        }
        mouseDownMove(this, evt);
        evt.preventDefault();
        return false;
      },
      'mouseup mouseout touchend': mouseUpOut
    });

    $('input,select', '#accordion').on('focus', function() {
      user_editing = true;
    });

    // LOLO: For Lock controls
    $('input,select', '#bottom_panel').on('focus', function() {
      user_editing = true;
    });
    $('input,select', '#leftpanel').on('focus', function() {
      user_editing = true;
    });
    // end


    $('#trig_mode').on('change', function() {
      onDropdownChange($(this), 'trig_mode', true);

      // Autorun if trigger mode is Auto(0) or Normal(1), stop if it is Single(2).
      autorun = (params.local.trig_mode == 2 ? 0 : 1);
      runStop();
    });

    $('#trig_source').on('change', function() { onDropdownChange($(this), 'trig_source'); });
    $('#trig_edge').on('change', function() { onDropdownChange($(this), 'trig_edge'); });

    $('#trig_level')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_trig_level').show();
      })
      .on('blur', function() {
        $('#apply_trig_level').hide();
        $(this).parent().removeClass('input-group');

        var tlev = parseLocalFloat($(this).val());
        var scale = (params.local.trig_source == 0 ? params.local.scale_ch1 : params.local.scale_ch2);
        if(! isNaN(tlev)) {
          params.local.trig_level = tlev / scale;
          updateTriggerSlider(undefined, false);
          redrawPlot();
          sendParams();
        }
        else {
          tlev = params.local.trig_level * scale;
          $(this).val(tlev)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    // Events binding for range controls

    $('#range_x_minus, #range_x_plus').on('click', function() {
      var nearest = $(this).data('nearest');

      if(nearest && plot) {
        var options = plot.getOptions();
        var axes = plot.getAxes();
        var min = (options.xaxes[0].min !== null ? options.xaxes[0].min : axes.xaxis.min);
        var max = (options.xaxes[0].max !== null ? options.xaxes[0].max : axes.xaxis.max);
        var unit = $(this).data('unit');

        // Convert nanoseconds to milliseconds.
        if(unit == 'ns') {
          nearest /= 1000;
        }

        var center = (min + max) / 2;
        var half = nearest / 2;
        min = center - half;
        max = center + half;

        options.xaxes[0].min = min;
        options.xaxes[0].max = max;

        plot.setupGrid();
        plot.draw();

        params.local.xmin = min;
        params.local.xmax = max;

        updateRanges();
        $(this).tooltip($(this).prop('disabled') === true ? 'hide' : 'show');
        sendParams(true);
      }
    });

    $('#range_y_minus, #range_y_plus').on('click', function() {
      var nearest = $(this).data('nearest');

      if(nearest && plot) {
        var options = plot.getOptions();
        var axes = plot.getAxes();
        var min = (options.yaxes[0].min !== null ? options.yaxes[0].min : axes.yaxis.min);
        var max = (options.yaxes[0].max !== null ? options.yaxes[0].max : axes.yaxis.max);
        var unit = $(this).data('unit');

        // Convert millivolts to volts.
        if(unit == 'mV') {
          nearest /= 1000;
        }

        var center = (min + max) / 2;
        var half = nearest / 2;
        min = center - half;
        max = center + half;

        options.yaxes[0].min = min;
        options.yaxes[0].max = max;

        plot.setupGrid();
        plot.draw();

        updateRanges();
        $(this).tooltip($(this).prop('disabled') === true ? 'hide' : 'show');
        updateTriggerSlider();
      }
    });

    $('#offset_x_minus, #offset_x_plus').on('click', function() {
      if(plot) {
        var direction = ($(this).attr('id') == 'offset_x_minus' ? 'left' : 'right');
        var options = plot.getOptions();
        var axes = plot.getAxes();
        var min = (options.xaxes[0].min !== null ? options.xaxes[0].min : axes.xaxis.min);
        var max = (options.xaxes[0].max !== null ? options.xaxes[0].max : axes.xaxis.max);
        var offset = (max - min) * range_offset/100;

        if(direction == 'left') {
          min -= offset;
          max -= offset;
        }
        else {
          min += offset;
          max += offset;
        }

        options.xaxes[0].min = min;
        options.xaxes[0].max = max;

        plot.setupGrid();
        plot.draw();

        params.local.xmin = min;
        params.local.xmax = max;

        updateRanges();
        sendParams(true);
      }
    });

    $('#offset_y_minus, #offset_y_plus').on('click', function() {
      if(plot) {
        var direction = ($(this).attr('id') == 'offset_y_minus' ? 'down' : 'up');
        var options = plot.getOptions();
        var axes = plot.getAxes();
        var min = (options.yaxes[0].min !== null ? options.yaxes[0].min : axes.yaxis.min);
        var max = (options.yaxes[0].max !== null ? options.yaxes[0].max : axes.yaxis.max);
        var offset = (max - min) * range_offset/100;

        if(direction == 'down') {
          min -= offset;
          max -= offset;
        }
        else {
          min += offset;
          max += offset;
        }

        options.yaxes[0].min = min;
        options.yaxes[0].max = max;

        plot.setupGrid();
        plot.draw();

        updateRanges();
        updateTriggerSlider();
      }
    });

    // Events binding for gain controls

    $('#gain_ch1_att').on('change', function() { onDropdownChange($(this), 'prb_att_ch1'); });
    $('#gain_ch1_sett').on('change', function() { onDropdownChange($(this), 'gain_ch1'); });
    $('#gain_ch2_att').on('change', function() { onDropdownChange($(this), 'prb_att_ch2'); });
    $('#gain_ch2_sett').on('change', function() { onDropdownChange($(this), 'gain_ch2'); });

    // Events binding for signal generator

    $('#gen_enable_ch1, #gen_enable_ch2').on('change', function() {
      params.local[this.id] = ($(this).is(':checked') ? 1 : 0);
      sendParams();
    });

    $('#gen_ch1_sigtype').on('change', function() { onDropdownChange($(this), 'gen_sig_type_ch1'); });
    $('#gen_ch1_trigmode').on('change', function() { onDropdownChange($(this), 'gen_trig_mod_ch1'); });
    $('#gen_ch2_sigtype').on('change', function() { onDropdownChange($(this), 'gen_sig_type_ch2'); });
    $('#gen_ch2_trigmode').on('change', function() { onDropdownChange($(this), 'gen_trig_mod_ch2'); });

    $('#gen_ch1_ampl')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_gen_ch1_ampl').show();
      })
      .on('blur', function() {
        $('#apply_gen_ch1_ampl').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.gen_sig_amp_ch1 = val;
          sendParams();
        }
        else {
          $(this).val(params.local.gen_sig_amp_ch1)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#gen_ch1_freq')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_gen_ch1_freq').show();
      })
      .on('blur', function() {
        $('#apply_gen_ch1_freq').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.gen_sig_freq_ch1 = val;
          sendParams();
        }
        else {
          $(this).val(params.local.gen_sig_freq_ch1)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#gen_ch1_dc')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_gen_ch1_dc').show();
      })
      .on('blur', function() {
        $('#apply_gen_ch1_dc').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.gen_sig_dcoff_ch1 = val;
          sendParams();
        }
        else {
          $(this).val(params.local.gen_sig_dcoff_ch1)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#gen_ch2_ampl')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_gen_ch2_ampl').show();
      })
      .on('blur', function() {
        $('#apply_gen_ch2_ampl').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.gen_sig_amp_ch2 = val;
          sendParams();
        }
        else {
          $(this).val(params.local.gen_sig_amp_ch2)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#gen_ch2_freq')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_gen_ch2_freq').show();
      })
      .on('blur', function() {
        $('#apply_gen_ch2_freq').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.gen_sig_freq_ch2 = val;
          sendParams();
        }
        else {
          $(this).val(params.local.gen_sig_freq_ch2)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#gen_ch2_dc')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_gen_ch2_dc').show();
      })
      .on('blur', function() {
        $('#apply_gen_ch2_dc').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.gen_sig_dcoff_ch2 = val;
          sendParams();
        }
        else {
          $(this).val(params.local.gen_sig_dcoff_ch2)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });


    // Events binding for PID Controller

    $('#pid_11_enable, #pid_12_enable, #pid_21_enable, #pid_22_enable').on('change', function() {
      params.local[this.id] = ($(this).is(':checked') ? 1 : 0);
      sendParams();
    });

    $('#pid_11_rst, #pid_12_rst, #pid_21_rst, #pid_22_rst').on('change', function() {
      params.local[this.id] = ($(this).is(':checked') ? 1 : 0);
      sendParams();
    });

    // PID 11 Setpoint, Kp, Ki, Kd
    $('#pid_11_sp')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_11_sp').show();
      })
      .on('blur', function() {
        $('#apply_pid_11_sp').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_11_sp = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_11_sp)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_11_kp')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_11_kp').show();
      })
      .on('blur', function() {
        $('#apply_pid_11_kp').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_11_kp = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_11_kp)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_11_ki')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_11_ki').show();
      })
      .on('blur', function() {
        $('#apply_pid_11_ki').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_11_ki = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_11_ki)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_11_kd')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_11_kd').show();
      })
      .on('blur', function() {
        $('#apply_pid_11_kd').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_11_kd = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_11_kd)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    // PID 12 Setpoint, Kp, Ki, Kd
    $('#pid_12_sp')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_12_sp').show();
      })
      .on('blur', function() {
        $('#apply_pid_12_sp').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_12_sp = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_12_sp)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_12_kp')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_12_kp').show();
      })
      .on('blur', function() {
        $('#apply_pid_12_kp').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_12_kp = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_12_kp)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_12_ki')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_12_ki').show();
      })
      .on('blur', function() {
        $('#apply_pid_12_ki').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_12_ki = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_12_ki)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_12_kd')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_12_kd').show();
      })
      .on('blur', function() {
        $('#apply_pid_12_kd').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_12_kd = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_12_kd)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    // PID 21 Setpoint, Kp, Ki, Kd
    $('#pid_21_sp')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_21_sp').show();
      })
      .on('blur', function() {
        $('#apply_pid_21_sp').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_21_sp = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_21_sp)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_21_kp')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_21_kp').show();
      })
      .on('blur', function() {
        $('#apply_pid_21_kp').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_21_kp = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_21_kp)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_21_ki')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_21_ki').show();
      })
      .on('blur', function() {
        $('#apply_pid_21_ki').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_21_ki = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_21_ki)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_21_kd')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_21_kd').show();
      })
      .on('blur', function() {
        $('#apply_pid_21_kd').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_21_kd = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_21_kd)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    // PID 22 Setpoint, Kp, Ki, Kd
    $('#pid_22_sp')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_22_sp').show();
      })
      .on('blur', function() {
        $('#apply_pid_22_sp').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_22_sp = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_22_sp)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_22_kp')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_22_kp').show();
      })
      .on('blur', function() {
        $('#apply_pid_22_kp').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_22_kp = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_22_kp)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_22_ki')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_22_ki').show();
      })
      .on('blur', function() {
        $('#apply_pid_22_ki').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_22_ki = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_22_ki)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });

    $('#pid_22_kd')
      .on('focus paste', function() {
        $(this).parent().addClass('input-group');
        $('#apply_pid_22_kd').show();
      })
      .on('blur', function() {
        $('#apply_pid_22_kd').hide();
        $(this).parent().removeClass('input-group');

        var val = parseLocalFloat($(this).val());
        if(! isNaN(val)) {
          params.local.pid_22_kd = val;
          sendParams();
        }
        else {
          $(this).val(params.local.pid_22_kd)
        }
        user_editing = false;
      })
      .on('change', function() {
        $(this).blur();
      })
      .on('keypress', function(e) {
        if(e.keyCode == 13) {
          $(this).blur();
        }
      });


    // Modals

    $('#modal_err, #modal_app').modal({ show: false, backdrop: 'static', keyboard: false });
    $('#modal_help').modal({ show: false, backdrop: 'static', keyboard: false });
    $('#modal_save').modal({ show: false, backdrop: 'static', keyboard: false });
    $('#modal_config').modal({ show: false, backdrop: 'static', keyboard: false });
    $('#modal_upload').modal({ show: false });

    $('#btn_switch_app').on('click', function() {
      var newapp_id = $('#new_app_id').text();
      if(newapp_id.length) {
        location.href = location.href.replace(app_id, newapp_id);
      }
    });

    $('.btn-app-restart').on('click', function() {
      location.reload();
    });

    $('#btn_retry_get').on('click', function() {
      $('#modal_err').modal('hide');
      updateGraphData();
    });

    $('#btn_close').on('click', function() {
      $('#modal_help').modal('hide');
      //updateGraphData();
    });

    $('#btn_close_save').on('click', function() {
      $('#modal_save').modal('hide');
      //updateGraphData();
    });

    $('#btn_close_config').on('click', function() {
      $('#modal_config').modal('hide');
      //updateGraphData();
    });

    $('.btn-close-modal').on('click', function() {
      $(this).closest('.modal').modal('hide');
    });

    // Reset the upload form to prevent browser caching of the uploaded file name
    $('#upload_form')[0].reset();

    // Other event bindings

    $('#trigger_tooltip').tooltip({
      title: '',
      trigger: 'manual',
      placement: 'auto left',
      animation: false
    });

    $('.btn').on('click', function() {
      var btn = $(this);
      setTimeout(function() { btn.blur(); }, 10);
    });

    $('#btn_toolbar .btn').on('blur', function() {
      $(this).removeClass('active');
    });

    $(document).on('click', '#accordion > .panel > .panel-heading', function(event) {
      $(this).next('.panel-collapse').collapse('toggle');
      event.stopImmediatePropagation();
    });


    // LOLO
    $(document).on('click', '#bottom_panel > .panel > .panel-heading', function(event) {
      $(this).next('.panel-collapse').collapse('toggle');
      event.stopImmediatePropagation();
    });
    $(document).on('click', '#leftpanel > .panel > .panel-heading', function(event) {
      $(this).next('.panel-collapse').collapse('toggle');
      event.stopImmediatePropagation();
    });

    $('#btn_set_trig').on('click', function() {
      $('#btn_set_trig').prop('disabled', true);
      if( $('#btn_set_trig_auto_zoom').is(':checked') ){
        user_editing = true;
        var max_time_val = 2*(params.local.lock_ramp_hig_lim-params.local.lock_ramp_low_lim)*(params.local.lock_ramp_step+1) ;
        max_time_val = params.local.time_units == 0 ? max_time_val * 8 / 1000       :
                       params.local.time_units == 1 ? max_time_val * 8 / 1000000    :
                                                      max_time_val * 8 / 1000000000 ;


        params.local.trig_source=2 ;
        params.local.trig_mode=1 ;
        params.local.lock_trig_sw=2

        opt=plot.getOptions();
        opt.xaxes[0].min=0-max_time_val*0.1;
        opt.xaxes[0].max=max_time_val*1.1;

        params.local.trig_delay=0-max_time_val*0.1;
        params.local.xmin=0-max_time_val*0.1;
        params.local.xmax=max_time_val*1.1;
        params.local.gui_xmin=0-max_time_val*0.1;
        params.local.gui_xmax=max_time_val*1.1;

        setTimeout(function(){  autoscaleY(); }, update_interval*5 );

        sendParams();
      }
      set_trigger_val=true;
    });

    // Tooltips for range buttons
    $('#range_x_minus, #range_x_plus, #range_y_minus, #range_y_plus').tooltip({
      container: 'body'
    });


    // LOLO begin ------------------------------------------------------


    // [LOLO DOCK PAGELOAD]

    // Number inputs
    var input_number=['lock_lock_trig_val','lock_lock_trig_time_val','lock_rl_error_threshold','lock_rl_signal_threshold','lock_sf_jumpA',
                      'lock_sf_jumpB','lock_error_offset','lock_gen_mod_phase','lock_gen_mod_phase_sq','lock_gen_mod_hp','lock_gen_mod_sqp',
                      'lock_ramp_step','lock_ramp_low_lim','lock_ramp_hig_lim','lock_ramp_B_factor','lock_pidA_sp','lock_pidA_kp','lock_pidA_ki',
                      'lock_pidA_kd','lock_pidB_sp','lock_pidB_kp','lock_pidB_ki','lock_pidB_kd','lock_aux_A','lock_aux_B'];

    for(ii in input_number){
      $('#'+input_number[ii])
        // on focus or paste, start editing mode
        .on('focus paste', function() {
            iname=$(this)[0].id;
            $(this).parent().addClass('input-group');
            //$('#'+iname+'_apply').show();
         })
        // on blur (focus lost), check data and send to server
        .on('blur', function(event) {
            iname=$(this)[0].id;
            //console.log(iname);
            //$('#'+iname+'_apply').hide();
            text_param_editor='';
            $(this).parent().removeClass('input-group');
            var val = parseLocalFloat($(this).val());
            if(! isNaN(val)) {
              params.local[iname] = val;
              sendParams();
            }
            else {
              $(this).val(params.local[iname])
            }
            if(event.relatedTarget)
              if(event.relatedTarget.tagName=="INPUT")
                setTimeout(function(){ user_editing = true; }, update_interval ) ;
            user_editing = false;
        })
        .on('input', function(event) {
            iname=$(this)[0].id;
            //console.log('input:'+iname);
            //$('#'+iname+'_apply').hide();
            user_editing = true;
            var val = parseLocalFloat($(this).val());
            setTimeout(function(pp){
              iname=pp[1];
              //console.log(iname);
              //console.log(user_editing);
              if (text_param_editor==''){
                var val = parseLocalFloat($('#'+iname).val());
                if(val==pp[0]){
                  if(! isNaN(val)) {
                    params.local[iname] = val;
                    sendParams();
                  }
                }
              }
              user_editing = true;
            }, 100  , [val,iname] ) ;
        })
        .on('keydown', function(e) {
            //console.log('keydown:'+$(this)[0].id);
            //console.log('log:'+text_param_editor+' key:'+e.key );
            if( $.inArray(e.key, ['Backspace','Delete','0','1','2','3','4','5','6','7','8','9','+','-',',','.'] ) >0 ){
              text_param_editor=$(this)[0].id;
              //console.log('now:'+text_param_editor);
              //e.preventDefault();
              e.stopPropagation();
            }
        })
        // If press "enter", launch .blur()
        .on('keypress', function(e) {
            if(e.keyCode == 13) {
              $(this).blur();
            }
        });

    }



    // on change functions
    $('#lock_lock_trig_time_val,#lock_lock_trig_val').on('input', function() {
        lock_ctrl_update();
        //$(this).blur();
    });
    $('#lock_gen_mod_phase,#lock_gen_mod_hp,#lock_gen_mod_sqp').on('input', function() {
        lock_modulation_update();
        //$(this).blur();
    });

    $('#lock_pidA_sp,#lock_pidA_kp,#lock_pidA_ki,#lock_pidA_kd').on('input', function() {
        lock_pidA_update();
        //$(this).blur();
    });
    $('#lock_pidB_sp,#lock_pidB_kp,#lock_pidB_ki,#lock_pidB_kd').on('input', function() {
        lock_pidB_update();
        //$(this).blur();
    });
    $('#lock_ramp_step,#lock_ramp_low_lim,#lock_ramp_hig_lim,#lock_ramp_B_factor').on('input', function() {
        lock_ramp_step_update();
        //$(this).blur();
    });
    /*$('#lock_aux_A,#lock_aux_B,#lock_osc_ctrl').on('change', function() {
        $(this).blur();
    });*/


    // Switches
    var switches=['#lock_oscA_sw','#lock_oscB_sw','#lock_trig_sw','#lock_out1_sw','#lock_out2_sw','#lock_slow_out1_sw','#lock_slow_out2_sw',
                  '#lock_slow_out3_sw','#lock_slow_out4_sw','#lock_lock_trig_sw','#lock_rl_signal_sw','#lock_signal_sw','#lock_sg_amp1',
                  '#lock_sg_amp2','#lock_sg_amp3','#lock_sg_amp_sq','#lock_lpf_F1_tau','#lock_lpf_F1_order','#lock_lpf_F2_tau','#lock_lpf_F2_order',
                  '#lock_lpf_F3_tau','#lock_lpf_F3_order','#lock_lpf_sq_tau','#lock_lpf_sq_order','#lock_error_sw','#lock_read_ctrl','#lock_pidA_sw',
                  '#lock_pidA_PSR','#lock_pidA_ISR','#lock_pidA_DSR','#lock_pidA_SAT','#lock_pidB_sw','#lock_pidB_PSR','#lock_pidB_ISR',
                  '#lock_pidB_DSR','#lock_pidB_SAT','#lock_ctrl_aux_trig_type'];
    for(ii in switches)
        $(switches[ii]).on('change', function() { onDropdownChange($(this), $(this)[0].id ); });

    // [LOLO DOCK PAGELOAD END]


    // Buttons
    var input_buttons = '#lock_osc_raw_mode,#lock_osc_lockin_mode,#lock_sf_start,#lock_ctrl_aux_lock_now,#lock_ctrl_aux_launch_lock_trig,'+
                        '#lock_ctrl_aux_pidB_enable_ctrl,#lock_ctrl_aux_pidA_enable_ctrl,#lock_ctrl_aux_ramp_enable_ctrl,#lock_mod_sq_on,'+
                        '#lock_mod_harmonic_on';
    $(input_buttons).on('click', function() {
      $(this).toggleClass('btn-default btn-primary');
      params.local[this.id] = ($(this).is('.btn-primary') ? 1 : 0);
      sendParams();
    });

    // Checkboxes inputs
    var input_checkboxes = '#lock_osc1_filt_off,#lock_osc2_filt_off,#lock_rl_error_enable,#lock_rl_signal_enable,#lock_rl_reset,#lock_sf_AfrzO,'+
                           '#lock_sf_AfrzI,#lock_sf_BfrzO,#lock_sf_BfrzI,#lock_ramp_reset,#lock_ramp_enable,#lock_ramp_direction,#lock_pidA_irst,'+
                           '#lock_pidA_freeze,#lock_pidA_ifreeze,#lock_pidB_irst,#lock_pidB_freeze,#lock_pidB_ifreeze,#lock_ctrl_aux_set_pidB_enable,'+
                           '#lock_ctrl_aux_set_pidA_enable,#lock_ctrl_aux_set_ramp_enable,#lock_ctrl_aux_lock_trig_rise';
    $(input_checkboxes).on('change', function() {
      params.local[this.id] = ($(this).is(':checked') ? 1 : 0);
      sendParams();
    });


    // More Switches
    $('#lock_ctrl_aux_trig_type').on('change', function() { onDropdownChange($(this), 'lock_ctrl_aux_trig_type'); });

    $('#lock_mod_sq_on').on('click', function() {
            $('#lock_mod_sq_on').toggleClass('btn-default btn-primary');
            $("div[data-tag='SquareParams']").toggleClass('in collapse') ;
        });

    $('#lock_mod_harmonic_on').on('click', function() {
            $('#lock_mod_harmonic_on').toggleClass('btn-default btn-primary');
            $("div[data-tag='HarmonicParams']").toggleClass('in collapse') ;
        });

    /* LOLO load_config_block_start */
    // load_config_block_start checkbox
    $('#load_config_block_start').on('change', function() {
      load_config_block_start = ($(this).is(':checked') ? 1 : 0);
    });
    // */

    $('#btn_disp_units')
      .on('click', function() {
          if(! plot) return;
          $('#btn_disp_units').toggleClass('btn-default btn-primary');

          if($('#btn_disp_units').hasClass('btn-primary')) {
            $('#btn_disp_units').data('checked', true);
            $('#btn_disp_units').html('Raw');
          }
          else{
            $('#btn_disp_units').data('checked', false);
            $('#btn_disp_units').html('Units');
          }
       });

    $('#btn_disp_sq')
      .on('click', function() {
          if(! plot) return;
          $('#btn_disp_sq').toggleClass('btn-default btn-primary');

          if($('#btn_disp_sq').hasClass('btn-primary')) {
            $('#btn_disp_sq').data('checked', true);
            $('#btn_disp_sq').html('Square');
          }
          else{
            $('#btn_disp_sq').data('checked', false);
            $('#btn_disp_sq').html('Harmonic');
          }
       });

     $('#btn_disp_norm')
      .on('click', function() {
          if(! plot) return;
          $('#btn_disp_norm').toggleClass('btn-default btn-primary');

          if($('#btn_disp_norm').hasClass('btn-primary')) {
            $('#btn_disp_norm').data('checked', true);
            $('#btn_disp_norm').html('Output');
          }
          else{
            $('#btn_disp_norm').data('checked', false);
            $('#btn_disp_norm').html('Measure');
          }
       });

    $('#btn_stop')
      .on('click', function() {
          if(! plot) return;
          $('#btn_stop').toggleClass('btn-default btn-primary');

          if($('#btn_stop').hasClass('btn-primary')) {
            scope_stop = false;
            updateGraphData();
          }
          else{
            scope_stop = true;
          }
       });

    $('#btn_save')
      .on('click', function() {
          if(! plot) return;

          if($('#btn_stop').hasClass('btn-primary')) {
            scope_stop = false;
            updateGraphData();
          }
          else{
            scope_stop = true;
          }
       });

    $('#copy_python')
      .on('click', function() {
          if(! plot) return;
          event.preventDefault();

          $('#python_hide').removeClass('collapse');
          $('#text_python_data')[0].select();
          document.execCommand('copy');
          $('#python_hide').addClass('collapse');
       });

    $('#copy_matlab')
      .on('click', function() {
          if(! plot) return;
          event.preventDefault();

          $('#matlab_hide').removeClass('collapse');
          $('#text_matlab_data')[0].select();
          document.execCommand('copy');
          $('#matlab_hide').addClass('collapse');
       });

    $('#copy_csv')
      .on('click', function() {
          if(! plot) return;
          event.preventDefault();

          $('#csv_hide').removeClass('collapse');
          $('#text_csv_data')[0].select();
          document.execCommand('copy');
          $('#csv_hide').addClass('collapse');
       });

    if ( ! document.queryCommandSupported('copy') ) {
      var txt=$('#copy_python').html();
      $('#copy_python').html("<del>"+txt+"</del>");

      txt=$('#copy_matlab').html();
      $('#copy_matlab').html("<del>"+txt+"</del>");

      txt=$('#copy_csv').html();
      $('#copy_csv').html("<del>"+txt+"</del>");
    }

    $('#plot_holder').on("plothover", function (event, pos, item) {
        var str = "(" + pos.x.toFixed(2) + ", " + pos.y.toFixed(2) + ")";
        $("#hoverdata").text(str);
    });

    $("#plot_holder").on("plotclick", function (event, pos, item) {
        if (set_trigger_val) {
            var time_raw =pos.x;
            var level_raw=pos.y;

            var time_val  = Math.round(  time_raw  *( Math.pow(10, (params.local.time_units-2)*3 ) )/8e-9) ;
            var level_val = params.local.lock_osc_raw_mode==0 ? Math.round(level_raw*8192) : level_raw ;

            var max_time_val = 2*(params.local.lock_ramp_hig_lim-params.local.lock_ramp_low_lim)*(params.local.lock_ramp_step+1) ;
            time_val         = time_val % max_time_val;

            if(time_val<0) time_val = time_val + max_time_val;

            user_editing=false;
            trigger_just_set=true;
            $('#lock_lock_trig_time_val').val(time_val);
            params.local.lock_lock_trig_time_val=time_val;

            $('#lock_lock_trig_val').val(level_val);
            params.local.lock_lock_trig_val=level_val;

            $('#lock_lock_trig_val').blur();


            $('#btn_set_trig').prop('disabled', false);
            set_trigger_val=false;
        }
    });


    lock_ramp_step_update();
    lock_modulation_update();
    lock_ctrl_update();
    lock_pidA_update();
    lock_pidB_update();
    lpf_update();

    $('[data-toggle="tooltip"]').tooltip({container: 'body'});

    $('option[data-tag=pidA_more]').hide();
    $('option[data-tag=pidB_more]').hide();

    $('#btn_config_load_file')[0].addEventListener('change', config_load_file, false);

    $('#config_name_input').on('change', function() {  config_save_file();  });

    $(document).on('click', '#Fnavtabs .nav-tabs li', function() {
        $(".nav-tabs li").removeClass("active");
        $(this).addClass("active");
        //$('#slow_lock_in_hide div.row[id!="tab_header"]').hide();
        $('#tab_F1_body,#tab_F2_body,#tab_F3_body').hide();
        var tab_name = $(this).text().slice(-2) ;
        //console.log(tab_name);
        $('#tab_'+tab_name+'_body').show();

    });

    $('#btn_set_trig').prop('disabled', false);
    $('#btn_disp_sq').data('checked', false);

    $('label[for="lock_ramp_step"]').on('click', function() {
      showModalHelp("<p>Ramp period param sets the number of clock ticks the ramp control waits before jumping the next ramp value.</p>"+
                    "<p>The ramp signals goes one <tt>int</tt> up/down after <tt>ramp_step</tt> clock ticks. The name of this control"+
                    "is just to remember that it sets up the total period of the ramp function. The total period will depend on "+
                    "<tt>ramp_low_lim</tt> and <tt>ramp_hig_lim</tt> either.</p>");
      });



    // Load first data
    if(window.location.href[0]!='f'){
      updateGraphData();
    } else{
      $('#bottom_panel').find('select').prop('disabled', false); // LOLO lock panel
      $('#leftpanel').find('select').prop('disabled', false); // LOLO left panel
    }

    // Stop the application when page is unloaded
    window.onbeforeunload = function() {
      $.ajax({
        url: stop_app_url,
        async: false
      });
    };

  });


  var units={ "-4": 'p', "-3": 'n', "-2": 'u', "-1": 'm', "0": '&nbsp;', "1": 'k', "2": 'M', "3": 'G', "4": 'T' };
  var magni={ "-4": '×10<sup>-12</sup>',"-3": '×10<sup>-9</sup>', "-2": '×10<sup>-6</sup>', "-1": '×10<sup>-3</sup>',
              "0": ' ',
              "1": '×10<sup>3</sup>', "2": '×10<sup>6</sup>', "3": '×10<sup>9</sup>', "4": '×10<sup>12</sup>' };

  function lock_ramp_step_update() {

    ramp_step_arr          = $("#lock_ramp_step"    ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_ramp_low_lim_arr  = $("#lock_ramp_low_lim" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_ramp_hig_lim_arr  = $("#lock_ramp_hig_lim" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_ramp_B_factor_arr = $("#lock_ramp_B_factor").val().trim().split(' ').filter( function(n,i){ return n!=="" } );

    if( !$.isNumeric(ramp_step_arr[0]) ||
        !$.isNumeric(lock_ramp_low_lim_arr[0]) ||
        !$.isNumeric(lock_ramp_hig_lim_arr[0]) ||
        !$.isNumeric(lock_ramp_B_factor_arr[0])
        ) return -1 ;

    if (params) if (params.local)
    if( parseLocalFloat(ramp_step_arr[0])          == ramp_step  &&
        parseLocalFloat(lock_ramp_low_lim_arr[0])  == lock_ramp_low_lim &&
        parseLocalFloat(lock_ramp_hig_lim_arr[0])  == lock_ramp_hig_lim &&
        parseLocalFloat(lock_ramp_B_factor_arr[0]) == lock_ramp_B_factor
        ) return -1 ;

    ramp_step          = Math.abs( parseLocalFloat( ramp_step_arr[0] ) );
    lock_ramp_low_lim  = parseLocalFloat( lock_ramp_low_lim_arr[0]  ) ;
    lock_ramp_hig_lim  = parseLocalFloat( lock_ramp_hig_lim_arr[0]  ) ;
    lock_ramp_B_factor = parseLocalFloat( lock_ramp_B_factor_arr[0] ) ;

    if( lock_ramp_low_lim_arr.length === 2) {
      if ( lock_ramp_low_lim_arr[1].toLowerCase()=="v" )
        lock_ramp_low_lim = Math.round( lock_ramp_low_lim * 8192 );
      if ( lock_ramp_low_lim_arr[1].toLowerCase()=="mv" )
        lock_ramp_low_lim = Math.round( lock_ramp_low_lim * 8192 /1000 );
      lock_ramp_low_lim = Math.min(  8191 , lock_ramp_low_lim  ) ;
      lock_ramp_low_lim = Math.max( -8192 , lock_ramp_low_lim  ) ;
      $("#lock_ramp_low_lim").val(""+lock_ramp_low_lim);
    }

    if( lock_ramp_hig_lim_arr.length === 2) {
      if ( lock_ramp_hig_lim_arr[1].toLowerCase()=="v" )
        lock_ramp_hig_lim = Math.round( lock_ramp_hig_lim * 8192 );
      if ( lock_ramp_hig_lim_arr[1].toLowerCase()=="mv" )
        lock_ramp_hig_lim = Math.round( lock_ramp_hig_lim * 8192 /1000 );
      lock_ramp_hig_lim = Math.min(  8191 , lock_ramp_hig_lim  ) ;
      lock_ramp_hig_lim = Math.max( -8192 , lock_ramp_hig_lim  ) ;
      $("#lock_ramp_hig_lim").val(""+lock_ramp_hig_lim);
    }

    if ( lock_ramp_low_lim > lock_ramp_hig_lim ) {
      lock_ramp_low_lim = lock_ramp_hig_lim;
      $("#lock_ramp_low_lim").val(""+lock_ramp_low_lim);
    }

    if( ramp_step_arr.length === 2) {
      if ( ramp_step_arr[1].toLowerCase()=="s"  ||  ramp_step_arr[1].toLowerCase()=="seg" )
        ramp_step = ramp_step / 8e-9 / Math.abs(lock_ramp_hig_lim - lock_ramp_low_lim) ;
      if ( ramp_step_arr[1].toLowerCase()=="ms" )
        ramp_step = Math.round( ramp_step / 8e-9 / 1000 / Math.abs(lock_ramp_hig_lim - lock_ramp_low_lim) );
      $("#lock_ramp_step").val(""+ramp_step);
    }


    period = (lock_ramp_hig_lim - lock_ramp_low_lim) * (ramp_step+1) * 8e-9 * 2;

    if ( period === 0 ){
      txt=" OFF ";
    }else{
      oom = Math.floor(Math.log10(period)/3);
      val = period/Math.pow(10,3*oom);
      txt = "<small><b>&tau;&nbsp;=&nbsp;" + val.toFixed(2) + "&nbsp;" + units[oom.toString()] + "s</b>";

      oom  = Math.floor(Math.log10(1/period)/3);
      val  = (1/period)/Math.pow(10,3*oom);
      txt += " <br> <b>f&nbsp;=&nbsp;" + val.toFixed(2) + "&nbsp;" + units[oom.toString()] + "Hz</b></small>";
    }

    $('#lock_ramp_step_text').html( txt   );

    $('#lock_ramp_low_lim_text').html( "<small><b>" + (lock_ramp_low_lim/8192*1000).toFixed(0) + "&nbsp;mV</b></small>" );
    $('#lock_ramp_hig_lim_text').html( "<small><b>" + (lock_ramp_hig_lim/8192*1000).toFixed(0) + "&nbsp;mV</b></small>" );

    txt  =  "<p><b>" + ( (lock_ramp_hig_lim - lock_ramp_low_lim)/8192*1000 ).toFixed(0) + "&nbsp;mVpp</b>" ;
    txt +=  " <br> " ;
    txt +=  "<b>" + ( (lock_ramp_hig_lim + lock_ramp_low_lim)/2/8192*1000 ).toFixed(1) + "&nbsp;mVdc</b></p>" ;
    $('#lock_ramp_text').html( txt );

    $('#lock_ramp_B_factor_text').html( "<small><b>" + (lock_ramp_B_factor/4096).toFixed(5) + "</b></small>" );
  }

  function lpf_update(){

    var lpfs={0:'lock_lpf_F1_tau'   , 1:'lock_lpf_F2_tau'  , 2:'lock_lpf_F3_tau'  , 3:'lock_lpf_sq_tau',
              4:'lock_lpf_F1_order' , 5:'lock_lpf_F2_order', 6:'lock_lpf_F3_order', 7:'lock_lpf_sq_order'   };

    if (params.local){
        for ( i in lpfs){
          params.local[lpfs[i]]        = parseInt($('#'+lpfs[i]       ).val());
        }

        sendParams(true);

        for ( i in lpfs){
          $('#'+lpfs[i]        ).blur();
        }
    }
    user_editing = false;
  }


  function lock_pidA_update(){
    // Get inputs text values
    lock_pidA_sp_arr = $("#lock_pidA_sp" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_pidA_kp_arr = $("#lock_pidA_kp" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_pidA_ki_arr = $("#lock_pidA_ki" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_pidA_kd_arr = $("#lock_pidA_kd" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );

    // Check if inputs are numbers
    if( !$.isNumeric(lock_pidA_sp_arr[0]) ||
        !$.isNumeric(lock_pidA_kp_arr[0]) ||
        !$.isNumeric(lock_pidA_ki_arr[0]) ||
        !$.isNumeric(lock_pidA_kd_arr[0])    ) return -1 ;

    // Check if values changed from last execution. We don't want to update DIVs constantly but only
    // when there are changes (to save processor time / resources)
    if (params) if (params.local)
    if( parseInt(lock_pidA_sp_arr[0])         == pidA_sp &&
        parseInt(lock_pidA_kp_arr[0])         == pidA_kp &&
        parseInt(lock_pidA_ki_arr[0])         == pidA_ki &&
        parseInt(lock_pidA_kd_arr[0])         == pidA_kd &&
        parseInt(params.local.lock_pidA_PSR ) == parseInt($("#lock_pidA_PSR" ).val()) &&
        parseInt(params.local.lock_pidA_ISR ) == parseInt($("#lock_pidA_ISR" ).val()) &&
        parseInt(params.local.lock_pidA_DSR ) == parseInt($("#lock_pidA_DSR" ).val()) &&
        parseInt(params.local.lock_pidA_SAT ) == parseInt($("#lock_pidA_SAT" ).val())
        ) return -1 ;

    // Get number values
    pidA_sp = parseInt( lock_pidA_sp_arr[0] ) ;
    pidA_kp = parseInt( lock_pidA_kp_arr[0] ) ;
    pidA_ki = parseInt( lock_pidA_ki_arr[0] ) ;
    pidA_kd = parseInt( lock_pidA_kd_arr[0] ) ;

    // If there is a text that sets units, process the correct unit and number value
    if( lock_pidA_sp_arr.length === 2) {
      if ( lock_pidA_sp_arr[1].toLowerCase()=="v" )
        pidA_sp = Math.round( pidA_sp * 8192 );
      if ( lock_pidA_sp_arr[1].toLowerCase()=="mv" )
        pidA_sp = Math.round( pidA_sp * 8192 /1000 );
      pidA_sp = Math.min(  8191 , pidA_sp  ) ;
      pidA_sp = Math.max( -8192 , pidA_sp  ) ;
      $("#lock_pidA_sp").val(""+pidA_sp);
    }

    // Update text labels with correct info values

    var isrval=[0,3,6,10,13,16,20,23,26,30];
    var psrval=[0,3,6,10,12];

    // Integration part
    tau=8e-9 * Math.pow(2,isrval[parseInt($('#lock_pidA_ISR').val())]) / Math.abs( pidA_ki )  ;
    if ( pidA_ki === 0 ){
      txt='<div class="col-xs-12" ><small><b>OFF</b></small></div>';
    }else{
      oom = Math.floor(Math.log10(tau)/3);
      val = tau/Math.pow(10,3*oom);
      txt = '<div class="col-xs-12 col-md-6" ><small><b>&tau;&nbsp;=&nbsp;' + val.toPrecision(3) + '&nbsp;' + units[oom.toString()] + 's</b></small></div>';

      oom  = Math.floor(Math.log10(1/tau)/3);
      val  = (1/tau)/Math.pow(10,3*oom);
      //txt += '<br class="visible-xs visible-sm">';
      txt += '<div class="col-xs-12 col-md-6" ><small><b>f&nbsp;=&nbsp;' + val.toPrecision(3) + '&nbsp;' + units[oom.toString()] + 'Hz</b></small></div>';
    }
    $('#lock_pidA_ki_text').html( txt   );

    // Derivative part
    tau=8e-9 * Math.pow(2,parseInt($('#lock_pidA_DSR').val())-6) * Math.abs(pidA_kd*60) ;
    if ( pidA_kd === 0 ){
      txt='<div class="col-xs-12" ><small><b>OFF</b></small></div>';
    }else{
      oom = Math.floor(Math.log10(tau)/3);
      val = tau/Math.pow(10,3*oom);
      txt = '<div class="col-xs-12 col-md-6" ><small><b>&tau;&nbsp;=&nbsp;' + val.toPrecision(3) + '&nbsp;' + units[oom.toString()] + 's</b></small></div>';

      oom  = Math.floor(Math.log10(1/tau)/3);
      val  = (1/tau)/Math.pow(10,3*oom);
      //txt += '<br class="visible-xs visible-sm">';
      txt += '<div class="col-xs-12 col-md-6" ><small><b>f&nbsp;=&nbsp;' + val.toPrecision(3) + '&nbsp;' + units[oom.toString()] + 'Hz</b></small></div>';
    }
    $('#lock_pidA_kd_text').html( txt   );

    // Proportional part
    mult= Math.abs(pidA_kp) / Math.pow(2,psrval[parseInt($('#lock_pidA_PSR').val())] ) ;
    if ( pidA_kp === 0 ){
      txt="0";
    }else{
      oom = Math.min( 0 , Math.ceil(Math.log10(mult)/3) );
      val = Math.sign(pidA_kp)*mult/(Math.pow(10,3*oom));
      txt = "&nbsp;" + val.toFixed(3) + "&nbsp;" + magni[oom.toString()] ;
    }

    $('#lock_pidA_kp_text').html( '<div class="col-xs-12" ><small><b>'+txt+'</b></small></div>'   );

    // set - point
    setpoint=Math.round(pidA_sp / 8191*1000*100 )/100 ;
    $('#lock_pidA_sp_text').html( "<small><b>"+setpoint.toFixed(2)+"&nbsp;mV</b></small>"   );

  }

  function lock_pidB_update(){
    // Get inputs text values
    lock_pidB_sp_arr = $("#lock_pidB_sp" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_pidB_kp_arr = $("#lock_pidB_kp" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_pidB_ki_arr = $("#lock_pidB_ki" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_pidB_kd_arr = $("#lock_pidB_kd" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );

    // Check if inputs are numbers
    if( !$.isNumeric(lock_pidB_sp_arr[0]) ||
        !$.isNumeric(lock_pidB_kp_arr[0]) ||
        !$.isNumeric(lock_pidB_ki_arr[0]) ||
        !$.isNumeric(lock_pidB_kd_arr[0])    ) return -1 ;

    // Check if values changed from last execution. We don't want to update DIVs constantly but only
    // when there are changes (to save processor time / resources)
    if (params) if (params.local)
    if( parseInt(lock_pidB_sp_arr[0])         == pidB_sp &&
        parseInt(lock_pidB_kp_arr[0])         == pidB_kp &&
        parseInt(lock_pidB_ki_arr[0])         == pidB_ki &&
        parseInt(lock_pidB_kd_arr[0])         == pidB_kd &&
        parseInt(params.local.lock_pidB_PSR ) == parseInt($("#lock_pidB_PSR" ).val()) &&
        parseInt(params.local.lock_pidB_ISR ) == parseInt($("#lock_pidB_ISR" ).val()) &&
        parseInt(params.local.lock_pidB_DSR ) == parseInt($("#lock_pidB_DSR" ).val()) &&
        parseInt(params.local.lock_pidB_SAT ) == parseInt($("#lock_pidB_SAT" ).val())
        ) return -1 ;

    // Get number values
    pidB_sp = parseInt( lock_pidB_sp_arr[0] ) ;
    pidB_kp = parseInt( lock_pidB_kp_arr[0] ) ;
    pidB_ki = parseInt( lock_pidB_ki_arr[0] ) ;
    pidB_kd = parseInt( lock_pidB_kd_arr[0] ) ;

    // If there is a text that sets units, process the correct unit and number value
    if( lock_pidB_sp_arr.length === 2) {
      if ( lock_pidB_sp_arr[1].toLowerCase()=="v" )
        pidB_sp = Math.round( pidB_sp * 8192 );
      if ( lock_pidB_sp_arr[1].toLowerCase()=="mv" )
        pidB_sp = Math.round( pidB_sp * 8192 /1000 );
      pidB_sp = Math.min(  8191 , pidB_sp  ) ;
      pidB_sp = Math.max( -8192 , pidB_sp  ) ;
      $("#lock_pidB_sp").val(""+pidB_sp);
    }

    // Update text labels with correct info values

    var isrval=[0,3,6,10,13,16,20,23,26,30];
    var psrval=[0,3,6,10,12];

    // Integration part
    tau=8e-9 * Math.pow(2,isrval[parseInt($('#lock_pidB_ISR').val())]) / Math.abs( pidB_ki )  ;
    if ( pidB_ki === 0 ){
      txt='<div class="col-xs-12" ><small><b>OFF</b></small></div>';
    }else{
      oom = Math.floor(Math.log10(tau)/3);
      val = tau/Math.pow(10,3*oom);
      txt = '<div class="col-xs-12 col-md-6" ><small><b>&tau;&nbsp;=&nbsp;' + val.toPrecision(3) + '&nbsp;' + units[oom.toString()] + 's</b></small></div>';

      oom  = Math.floor(Math.log10(1/tau)/3);
      val  = (1/tau)/Math.pow(10,3*oom);
      //txt += '<br class="visible-xs visible-sm">';
      txt += '<div class="col-xs-12 col-md-6" ><small><b>f&nbsp;=&nbsp;' + val.toPrecision(3) + '&nbsp;' + units[oom.toString()] + 'Hz</b></small></div>';
    }
    $('#lock_pidB_ki_text').html( txt   );

    // Derivative part
    tau=8e-9 * Math.pow(2,parseInt($('#lock_pidB_DSR').val())-6) * Math.abs(pidA_kd*60) ;
    if ( pidB_kd === 0 ){
      txt='<div class="col-xs-12" ><small><b>OFF</b></small></div>';
    }else{
      oom = Math.floor(Math.log10(tau)/3);
      val = tau/Math.pow(10,3*oom);
      txt = '<div class="col-xs-12 col-md-6" ><small><b>f&nbsp;=&nbsp;' + val.toPrecision(3) + '&nbsp;' + units[oom.toString()] + 's</b></small></div>';

      oom  = Math.floor(Math.log10(1/tau)/3);
      val  = (1/tau)/Math.pow(10,3*oom);
      //txt += '<br class="visible-xs visible-sm">';
      txt += '<div class="col-xs-12 col-md-6" ><small><b>f&nbsp;=&nbsp;' + val.toPrecision(3) + '&nbsp;' + units[oom.toString()] + 'Hz</b></small></div>';
    }
    $('#lock_pidB_kd_text').html( txt   );

    // Proportional part
    mult= Math.abs(pidB_kp) / Math.pow(2,psrval[parseInt($('#lock_pidB_PSR').val())] ) ;
    if ( pidB_kp === 0 ){
      txt="0";
    }else{
      oom = Math.min( 0 , Math.ceil(Math.log10(mult)/3) );
      val = Math.sign(pidB_kp)*mult/(Math.pow(10,3*oom));
      txt = "&nbsp;" + val.toFixed(3) + "&nbsp;" + magni[oom.toString()] ;
    }

    $('#lock_pidB_kp_text').html( '<div class="col-xs-12" ><small><b>'+txt+'</b></small></div>'   );

    // set - point
    setpoint=Math.round(pidB_sp / 8191*1000*100 )/100 ;
    $('#lock_pidB_sp_text').html( "<small><b>"+setpoint.toFixed(2)+"&nbsp;mV</b></small>"   );

  }

  function lock_modulation_update() {
    lock_gen_mod_phase_arr    = $("#lock_gen_mod_phase"    ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_gen_mod_phase_sq_arr = $("#lock_gen_mod_phase_sq" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_gen_mod_hp_arr       = $("#lock_gen_mod_hp"       ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_gen_mod_sqp_arr      = $("#lock_gen_mod_sqp"      ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );



    if( !$.isNumeric(lock_gen_mod_phase_arr[0])    ||
        !$.isNumeric(lock_gen_mod_phase_sq_arr[0]) ||
        !$.isNumeric(lock_gen_mod_hp_arr[0])       ||
        !$.isNumeric(lock_gen_mod_sqp_arr[0])
        ) return -1 ;

    if (params) if (params.local)
    if( parseLocalFloat(lock_gen_mod_phase_arr[0])    == mod_phase     &&
        parseLocalFloat(lock_gen_mod_phase_sq_arr[0]) == mod_phase_sq  &&
        parseLocalFloat(lock_gen_mod_hp_arr[0])       == mod_hp        &&
        parseLocalFloat(lock_gen_mod_sqp_arr[0])      == mod_sqp
        ) return -1 ;

    mod_phase    = Math.abs( parseLocalFloat( lock_gen_mod_phase_arr[0] ) );
    mod_phase_sq = Math.abs( parseLocalFloat( lock_gen_mod_phase_sq_arr[0] ) );
    mod_hp       = Math.abs( parseLocalFloat( lock_gen_mod_hp_arr[0]   ) );
    mod_sqp      = Math.abs( parseLocalFloat( lock_gen_mod_sqp_arr[0]  ) );

    if( lock_gen_mod_phase_arr.length === 2) {
      if ( lock_gen_mod_phase_arr[1].toLowerCase()=="g" || lock_gen_mod_phase_arr[1].toLowerCase()=="deg" || lock_gen_mod_phase_arr[1].toLowerCase()=="°" )
        mod_phase = Math.round( (mod_phase % 360 ) / 360 * 2520 );
      if ( lock_gen_mod_phase_arr[1].toLowerCase()=="rad" )
        mod_phase = Math.round( ( mod_phase % (2*Math.PI) ) / (2*Math.PI) * 2520 );
      if ( lock_gen_mod_phase_arr[1].toLowerCase()=="pi" )
        mod_phase = Math.round( mod_phase / 2  * 2520 );
      mod_phase = Math.min(  2520 , mod_phase  ) ;
      mod_phase = Math.max(     0 , mod_phase  ) ;
      $("#lock_gen_mod_phase").val(""+mod_phase);
    }

    if( lock_gen_mod_hp_arr.length === 2) {
      if ( lock_gen_mod_hp_arr[1].toLowerCase()=="s" || lock_gen_mod_hp_arr[1].toLowerCase()=="seg" )
        mod_hp = Math.round( mod_hp / (2520*8e-9) )-1;
      if ( lock_gen_mod_hp_arr[1].toLowerCase()=="ms" )
        mod_hp = Math.round( mod_hp / (2520*8e-9*1000) )-1;
      if ( lock_gen_mod_hp_arr[1].toLowerCase()=="us"  || lock_gen_mod_hp_arr[1].toLowerCase()=="μs"   )
        mod_hp = Math.round( mod_hp / (2520*8e-9*1000*1000) )-1;
      mod_hp = Math.min(  819100 , mod_hp  ) ;
      mod_hp = Math.max(       0 , mod_hp  ) ;
      $("#lock_gen_mod_hp").val(""+mod_hp);
    }

    if( lock_gen_mod_sqp_arr.length === 2) {
      if ( lock_gen_mod_sqp_arr[1].toLowerCase()=="s"  || lock_gen_mod_sqp_arr[1].toLowerCase()=="seg")
        mod_sqp = Math.round( mod_sqp / 8e-9 /2 )-1;
      if ( lock_gen_mod_sqp_arr[1].toLowerCase()=="ms"  )
        mod_sqp = Math.round( mod_sqp / (8e-9 * 2 * 1000) )-1;
      if ( lock_gen_mod_sqp_arr[1].toLowerCase()=="us"  || lock_gen_mod_sqp_arr[1].toLowerCase()=="μs")
        mod_sqp = Math.round( mod_sqp / (8e-9 * 2 * 1000000 ) )-1;
      if ( lock_gen_mod_sqp_arr[1].toLowerCase()=="ns"  )
        mod_sqp = Math.round( mod_sqp / 8  ) ;
      mod_sqp = Math.min(  819100 , mod_sqp  ) ;
      mod_sqp = Math.max(       0 , mod_sqp  ) ;
      $("#lock_gen_mod_sqp").val(""+mod_sqp);
    }


    $('#lock_gen_mod_phase_text'   ).html( "<small><b>" + (mod_phase   /2520*360).toFixed(1) + "&nbsp;deg&nbsp;|&nbsp;" +   (mod_phase   /2520*2).toFixed(1) + "&nbsp;п&nbsp;rad</b></small>");

    hp_period=(mod_hp+1)*2520*8e-9;
    if ( hp_period === 0 ){
      txt=" OFF ";
    }else{
      oom = Math.floor(Math.log10(hp_period)/3);
      val = hp_period/Math.pow(10,3*oom);
      txt = "<small><b>&tau;&nbsp;=&nbsp;" + val.toFixed(3) + "&nbsp;" + units[oom.toString()] + "s</b>";

      oom  = Math.floor(Math.log10(1/hp_period)/3);
      val  = (1/hp_period)/Math.pow(10,3*oom);
      txt += " <br> <b>f&nbsp;=&nbsp;" + val.toFixed(3) + "&nbsp;" + units[oom.toString()] + "Hz</b></small>";
    }

    $('#lock_gen_mod_hp_text').html( txt   );

    sqp_period=(mod_sqp+1)*8e-9*2;
    if ( mod_sqp > 0 ){
      oom = Math.floor(Math.log10(sqp_period)/3);
      val = sqp_period/Math.pow(10,3*oom);
      txt = "<small><b>&tau;&nbsp;=&nbsp;" + val.toFixed(3) + "&nbsp;" + units[oom.toString()] + "s</b>";

      oom  = Math.floor(Math.log10(1/sqp_period)/3);
      val  = (1/sqp_period)/Math.pow(10,3*oom);
      txt += " <br> <b>f&nbsp;=&nbsp;" + val.toFixed(3) + "&nbsp;" + units[oom.toString()] + "Hz</b></small>";
    }

    $('#lock_gen_mod_sqp_text').html( txt   );

    sqp_num = ( mod_sqp > 0 ) ? (mod_sqp-1)*2+4 : 2520 ;
    $('#lock_gen_mod_phase_sq_text').html( "<small><b>" + (mod_phase_sq/sqp_num*360).toFixed(1) + "&nbsp;deg&nbsp;|&nbsp;" +   (mod_phase_sq/sqp_num*2).toFixed(1) + "&nbsp;п&nbsp;rad</b></small>");
  }


  function lock_ctrl_update() {
    lock_lock_trig_time_val_arr = $("#lock_lock_trig_time_val" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_lock_trig_val_arr      = $("#lock_lock_trig_val" ).val().trim().split(' ').filter( function(n,i){ return n!=="" } );
    lock_ctrl_aux_trig_type     = parseInt($("#lock_ctrl_aux_trig_type" ).val());

    if( !$.isNumeric(lock_lock_trig_time_val_arr[0]) || !$.isNumeric(lock_lock_trig_val_arr[0])  ) return -1 ;

    if (params) if (params.local)
    if( parseLocalFloat(lock_lock_trig_time_val_arr[0]) == trig_time  &&
        parseLocalFloat(lock_lock_trig_val_arr[0])      == trig_val   &&
        lock_ctrl_aux_trig_type                         == aux_trig_type
        ) return -1 ;

    trig_time    = Math.abs( parseLocalFloat( lock_lock_trig_time_val_arr[0] ) );
    trig_val     =           parseLocalFloat( lock_lock_trig_val_arr[0]        );
    aux_trig_type=                            lock_ctrl_aux_trig_type           ;

    if( lock_lock_trig_time_val_arr.length === 2) {
      if ( lock_lock_trig_time_val_arr[1].toLowerCase()=="s" || lock_lock_trig_time_val_arr[1].toLowerCase()=="seg" )
        trig_time = Math.round( trig_time / 8e-9 );
      if ( lock_lock_trig_time_val_arr[1].toLowerCase()=="ms" )
        trig_time = Math.round( trig_time / 8e-6 );
      if ( lock_lock_trig_time_val_arr[1].toLowerCase()=="us"  || lock_lock_trig_time_val_arr[1].toLowerCase()=="μs"   )
        trig_time = Math.round( trig_time / 8e-3 );
      trig_time = Math.min( 500000000 , trig_time  ) ;
      trig_time = Math.max(         0 , trig_time  ) ;
      $("#lock_lock_trig_time_val").val(""+trig_time);
    }

    if( lock_lock_trig_val_arr.length === 2) {
      if ( lock_lock_trig_val_arr[1].toLowerCase()=="v" )
        trig_val = Math.round( trig_val * 8192 );
      if ( lock_lock_trig_val_arr[1].toLowerCase()=="mv" )
        trig_val = Math.round( trig_val * 8192 /1000 );
      trig_val = Math.min(  8191 , trig_val  ) ;
      trig_val = Math.max( -8192 , trig_val  ) ;
      $("#lock_lock_trig_val").val(""+trig_val);
    }

    timeval = trig_time*8e-9;
    if ( timeval === 0 ){
      txt=" OFF ";
    }else{
      oom = Math.floor(Math.log10(timeval)/3);
      val = timeval/Math.pow(10,3*oom);
      txt = "<b>T&nbsp;=&nbsp;" + val.toFixed(3) + "&nbsp;" + units[oom.toString()] + "s</b>";
    }

    $('#lock_lock_trig_time_val_text').html( txt   );

    $('#lock_lock_trig_val_text').html( "<small><b>V<sub>trg</sub>&nbsp;=&nbsp;" + (trig_val/8192*1000).toFixed(0) + "&nbsp;mV</b></small>" ) ;


    switch(lock_ctrl_aux_trig_type) {
        case 0:
            $('#container_lock_lock_trig_sw').addClass('hidden');
            $('#container_lock_lock_trig_time_val').addClass('hidden');
            $('#container_lock_lock_trig_val').addClass('hidden');
            $('#container_lock_ctrl_aux_lock_trig_rise').addClass('hidden');
            $('#container_btn_set_trig').addClass('hidden');
            break;
        case 1:
            $('#container_lock_lock_trig_sw').addClass('hidden');
            $('#container_lock_lock_trig_time_val').removeClass('hidden');
            $('#container_lock_lock_trig_val').addClass('hidden');
            $('#container_lock_ctrl_aux_lock_trig_rise').addClass('hidden');
            $('#container_btn_set_trig').removeClass('hidden');
            break;
        case 2:
            $('#container_lock_lock_trig_sw').removeClass('hidden');
            $('#container_lock_lock_trig_time_val').addClass('hidden');
            $('#container_lock_lock_trig_val').removeClass('hidden');
            $('#container_lock_ctrl_aux_lock_trig_rise').removeClass('hidden');
            $('#container_btn_set_trig').removeClass('hidden');
            break;
        case 3:
            $('#container_lock_lock_trig_sw').removeClass('hidden');
            $('#container_lock_lock_trig_time_val').removeClass('hidden');
            $('#container_lock_lock_trig_val').removeClass('hidden');
            $('#container_lock_ctrl_aux_lock_trig_rise').removeClass('hidden');
            $('#container_btn_set_trig').removeClass('hidden');
            break;
        default:
            $('#container_lock_lock_trig_sw').removeClass('hidden');
            $('#container_lock_lock_trig_time_val').removeClass('hidden');
            $('#container_lock_lock_trig_val').removeClass('hidden');
            $('#container_lock_ctrl_aux_lock_trig_rise').removeClass('hidden');
            $('#container_btn_set_trig').removeClass('hidden');
    }
  }

  function format_oom(num,unit="&nbsp;",pre=3){
      var oom = num==0 ? 0 : Math.floor(  Math.log10(Math.abs(num))/3) ;
      var val = num/Math.pow(10,3*oom);
      pre=Math.max(2,pre);
      var txt = val.toPrecision(pre)+"&nbsp;"+units[oom.toString()] + unit;
      return txt;
  }

  function set_bar(dispname,val) {
    var bar   = $('#'+dispname+'_bar');
    var label = $('#'+dispname);

    var valr = Math.abs(val)/134217728*100;
    bar.css('width', valr+'%').attr('aria-valuenow', valr);

    // label-info label-warning  label-danger
    if(Math.abs(val)<120795955) {
    bar.addClass('progress-bar-success').removeClass('progress-bar-danger').removeClass('progress-bar-warning');
    label.addClass('label-info').removeClass('label-warning').removeClass('label-danger');
    } else if ( Math.abs(val)<134217728 ){
    bar.removeClass('progress-bar-success').removeClass('progress-bar-danger').addClass('progress-bar-warning');
    label.removeClass('label-info').addClass('label-warning').removeClass('label-danger');
    } else {
    bar.removeClass('progress-bar-success').addClass('progress-bar-danger').removeClass('progress-bar-warning');
    label.removeClass('label-info').removeClass('label-warning').addClass('label-danger');
    }
  }

  function display_update() {
    if(!params.local) return 0;
    var set_raw  =  $('#lock_osc_raw_mode').data('checked');

    var disp_slow = $('#slow_lock_in_display').hasClass('in') ;
    var disp_fast = $('#fast_lock_in_display').hasClass('in') ;

    var scl = 1/2047/8191;
    if(set_raw) scl = 1/2048;

    if(disp_slow){
      var X = params.local.lock_X  *scl ;
      var Y = params.local.lock_Y  *scl ;
      var F1= params.local.lock_F1 *scl ;
      var F2= params.local.lock_F2 *scl ;
      var F3= params.local.lock_F3 *scl ;
      var R = Math.sqrt( Math.pow(X,2)+Math.pow(Y,2)) ;
      var Fi= Math.atan2(Y,X)*180/Math.PI ;

      if(set_raw){
        fixn=3;
        $('#disp_x' ).html(  X.toFixed(fixn) );
        $('#disp_y' ).html(  Y.toFixed(fixn) );
        $('#disp_r' ).html(  R.toFixed(fixn) );
        $('#disp_fi').html(  Fi.toFixed(2+fixn));
        $('#disp_F1').html(  F1.toFixed(fixn));
        $('#disp_F2').html(  F2.toFixed(fixn));
        $('#disp_F3').html(  F3.toFixed(fixn));
      }else{
        var fv0 = Math.max( params.local.lock_X.toString().length , params.local.lock_Y.toString().length )  ;
        var fv1 = params.local.lock_F1.toString().length ;
        var fv2 = params.local.lock_F2.toString().length ;
        var fv3 = params.local.lock_F3.toString().length ;

        $('#disp_x' ).html( format_oom(X ,'V',fv0) );
        $('#disp_y' ).html( format_oom(Y ,'V',fv0));
        $('#disp_r' ).html( format_oom(R ,'V',fv0));
        $('#disp_fi').html( format_oom(Fi,'deg'));
        $('#disp_F1').html( format_oom(F1,'V',fv1));
        $('#disp_F2').html( format_oom(F2,'V',fv2));
        $('#disp_F3').html( format_oom(F3,'V',fv3));
      }

      if ( (new Date().getTime()) > lasttsp+300 ) {
        lasttsp=Math.floor((new Date().getTime())/1000);
        set_bar( 'disp_x' ,  X);
        set_bar( 'disp_y' ,  Y);
        set_bar( 'disp_F1', F1);
        set_bar( 'disp_F2', F2);
        set_bar( 'disp_F3', F3);
      }
    }

    if (disp_fast) {
      var sqX = params.local.lock_sqX *scl;
      var sqY = params.local.lock_sqY *scl;
      var sqR = Math.sqrt( Math.pow(sqX,2)+Math.pow(sqY,2) ) ;
      var sqFi= Math.atan2(sqY,sqX)*180/Math.PI ;
      if(set_raw){
        fixn=3;
        $('#disp_sqx' ).html( sqX.toFixed(fixn)    );
        $('#disp_sqy' ).html( sqY.toFixed(fixn)    );
        $('#disp_sqr' ).html( sqR.toFixed(fixn)    );
        $('#disp_sqfi').html( sqFi.toFixed(2+fixn) );
      }else{
        var fvsq = Math.max( params.local.lock_sqX.toString().length , params.local.lock_sqY.toString().length )  ;
        $('#disp_sqx' ).html( format_oom(sqX ,'V',fvsq) );
        $('#disp_sqy' ).html( format_oom(sqY ,'V',fvsq) );
        $('#disp_sqr' ).html( format_oom(sqR ,'V',fvsq) );
        $('#disp_sqfi').html( format_oom(sqFi,'deg')   );
      }
      if ( (new Date().getTime()) > lasttsp+300 ) {
        lasttsp=Math.floor((new Date().getTime())/1000);
        set_bar( 'disp_sqx' ,  sqX);
        set_bar( 'disp_sqy' ,  sqY);
      }

    }

    var error_mean = params.local.lock_error_mean;

    if(isNaN(params.local.lock_error_std))
      var error_std  = 0;
    else
      var error_std  = params.local.lock_error_std;

    if (set_raw) {
      if (!last_disp_units) {
        $('label[for="disp_x"]' ).html("X [int]");
        $('label[for="disp_y"]' ).html("Y [int]");
        $('label[for="disp_r"]' ).html("R [int]");
        $('label[for="disp_fi"]').html("ϕ [deg]");
        $('label[for="disp_F1"]').html("F1 [int]");
        $('label[for="disp_F2"]').html("F2 [int]");
        $('label[for="disp_F3"]').html("F3 [int]");
      }
    } else {
      if (last_disp_units) {
        $('label[for="disp_x"]' ).html("X");
        $('label[for="disp_y"]' ).html("Y");
        $('label[for="disp_r"]' ).html("R");
        $('label[for="disp_fi"]').html("ϕ");
        $('label[for="disp_F1"]').html("F1");
        $('label[for="disp_F2"]').html("F2");
        $('label[for="disp_F3"]').html("F3");
      }
    }
    $('#disp_error_mean' ).html( error_mean );
    $('#disp_error_std'  ).html( error_std );

    last_disp_units=$('#btn_disp_units').data('checked');

  }

  function showModalHelp(err_msg) {
    var err_modal = $('#modal_help');

    err_modal.find('.modal-body').html(err_msg);
    err_modal.modal('show');
  }

  function showModalSave(err_msg) {
    var save_modal = $('#modal_save');

    // Python save
    vectxt_py="from numpy import * \nimport matplotlib.pyplot as plt\n\n";
    vectxt_py+="# Application: "+app_id+"\n# Version: "+app_version+"\n\n";

    if ($('#btn_ch' + 1).data('checked')) {
        vectxt_py+="##################################################\n";
        vectxt_py+="# Channel 1 data\n";
        vectxt_py+="##################################################\n\n";
        vectxt_py+="t1  = array([ ";

        for (i = 0; i < plot.getData()[0].data.length; i++) {
            addnum  = plot.getData()[0].data[i][0].toFixed(3);
            if(addnum.length<8)
              addnum = " ".repeat(8-addnum.length) + addnum ;
            vectxt_py += addnum;
            if (i < plot.getData()[0].data.length -1 ) vectxt_py += ", ";
            if ( i % 8 == 7 ) vectxt_py += "\n              ";
        }

        vectxt_py += " ]) ;\n\n";

        vectxt_py+="ch1 = array([ ";
        for (i = 0; i < plot.getData()[0].data.length; i++) {
            addnum  = plot.getData()[0].data[i][1].toFixed(3);
            if(addnum.length<8)
              addnum = " ".repeat(8-addnum.length) + addnum ;
            vectxt_py += addnum;
            if (i < plot.getData()[0].data.length -1 ) vectxt_py += ", ";
            if ( i % 8 == 7 ) vectxt_py += "\n              ";
        }
        vectxt_py += " ]) ;\n\n";
    }
    if ($('#btn_ch' + 2).data('checked')) {
        vectxt_py+="##################################################\n";
        vectxt_py+="# Channel 2 data\n";
        vectxt_py+="##################################################\n\n";
        vectxt_py+="t2  = array([ ";
        for (i = 0; i < plot.getData()[1].data.length; i++) {
            addnum  = plot.getData()[1].data[i][0].toFixed(3);
            if(addnum.length<8)
              addnum = " ".repeat(8-addnum.length) + addnum ;
            vectxt_py += addnum;
            if (i < plot.getData()[1].data.length -1 ) vectxt_py += ", ";
            if ( i % 8 == 7 ) vectxt_py += "\n              ";
        }

        vectxt_py += " ]) ;\n\n";

        vectxt_py+="ch2 = array([ ";
        for (i = 0; i < plot.getData()[1].data.length; i++) {
            addnum  = plot.getData()[1].data[i][1].toFixed(3);
            if(addnum.length<8)
              addnum = " ".repeat(8-addnum.length) + addnum ;
            vectxt_py += addnum;
            if (i < plot.getData()[1].data.length -1 ) vectxt_py += ", ";
            if ( i % 8 == 7 ) vectxt_py += "\n              ";
        }
        vectxt_py += " ]) ;\n\n";
    }


    var arr=[];
    var ii=0;

    for (var property in params.local ) {
      arr[ii]='        '+'"'+property+'":'+' '+ params.local[property];
      ii++;
    }

    vectxt_py += '\nparams={\n' + arr.join(', \n') + '\n}\n\n';



    $('#text_python_data').val(vectxt_py);


    // matlab save
    vectxt_mat="%% lock-in+pid saved data\n\n";
    vectxt_mat+="% Application: "+app_id+"\n% Version: "+app_version+"\n\n";

    if ($('#btn_ch' + 1).data('checked')) {
        vectxt_mat+="%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n";
        vectxt_mat+="% Channel 1 data\n";
        vectxt_mat+="%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n\n";
        vectxt_mat+="t1  = [ ";

        for (i = 0; i < plot.getData()[0].data.length; i++) {
            addnum  = plot.getData()[0].data[i][0].toFixed(3);
            if(addnum.length<8)
              addnum = " ".repeat(8-addnum.length) + addnum ;
            vectxt_mat += addnum;
            if (i < plot.getData()[0].data.length -1 ) vectxt_mat += ", ";
            if ( i % 8 == 7 ) vectxt_mat += " ...\n        ";
        }

        vectxt_mat += " ] ;\n\n";

        vectxt_mat+="ch1 = [ ";
        for (i = 0; i < plot.getData()[0].data.length; i++) {
            addnum  = plot.getData()[0].data[i][1].toFixed(3);
            if(addnum.length<8)
              addnum = " ".repeat(8-addnum.length) + addnum ;
            vectxt_mat += addnum;
            if (i < plot.getData()[0].data.length -1 ) vectxt_mat += ", ";
            if ( i % 8 == 7 ) vectxt_mat += " ...\n        ";
        }
        vectxt_mat += " ] ;\n\n";
    }
    if ($('#btn_ch' + 2).data('checked')) {
        vectxt_mat+="%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n";
        vectxt_mat+="% Channel 2 data\n";
        vectxt_mat+="%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%\n\n";
        vectxt_mat+="t2  = array([ ";
        for (i = 0; i < plot.getData()[1].data.length; i++) {
            addnum  = plot.getData()[1].data[i][0].toFixed(3);
            if(addnum.length<8)
              addnum = " ".repeat(8-addnum.length) + addnum ;
            vectxt_mat += addnum;
            if (i < plot.getData()[1].data.length -1 ) vectxt_mat += ", ";
            if ( i % 8 == 7 ) vectxt_mat += " ...\n        ";
        }

        vectxt_mat += " ] ;\n\n";

        vectxt_mat+="ch2 = array([ ";
        for (i = 0; i < plot.getData()[1].data.length; i++) {
            addnum  = plot.getData()[1].data[i][1].toFixed(3);
            if(addnum.length<8)
              addnum = " ".repeat(8-addnum.length) + addnum ;
            vectxt_mat += addnum;
            if (i < plot.getData()[1].data.length -1 ) vectxt_mat += ", ";
            if ( i % 8 == 7 ) vectxt_mat += " ...\n        ";
        }
        vectxt_mat += " ] ;\n\n";
    }

    $('#text_matlab_data').val(vectxt_mat);

    // csv save
    vectxt_csv="";
    if ($('#btn_ch' + 1).data('checked')){
      vectxt_csv+="t1      ,ch1     ";
      if ($('#btn_ch' + 2).data('checked')){
        vectxt_csv+=",";
      } else {
        vectxt_csv+="\n";
      }
    }
    if ($('#btn_ch' + 2).data('checked'))
      vectxt_csv+="t2      ,ch2     \n";

    for (i = 0; i < plot.getData()[0].data.length; i++) {
      if ($('#btn_ch' + 1).data('checked')) {
        addnum  = plot.getData()[0].data[i][0].toFixed(3);
        if(addnum.length<8)
          addnum = " ".repeat(8-addnum.length) + addnum ;
        vectxt_csv += addnum;
        vectxt_csv += ", ";
        addnum  = plot.getData()[0].data[i][1].toFixed(3);
        if(addnum.length<8)
          addnum = " ".repeat(8-addnum.length) + addnum ;
        vectxt_csv += addnum;
        if ($('#btn_ch' + 2).data('checked')){
          vectxt_csv += ", ";
        } else {
          vectxt_csv += "\n";
        }
      }
      if ($('#btn_ch' + 2).data('checked')) {
        addnum  = plot.getData()[1].data[i][0].toFixed(3);
        if(addnum.length<8)
          addnum = " ".repeat(8-addnum.length) + addnum ;
        vectxt_csv += addnum;
        vectxt_csv += ", ";
        addnum  = plot.getData()[1].data[i][1].toFixed(3);
        if(addnum.length<8)
          addnum = " ".repeat(8-addnum.length) + addnum ;
        vectxt_csv += addnum;
        vectxt_csv += "\n";

      }
    }

    $('#text_csv_data').val(vectxt_csv);


    var filename_py   =  "data_" + now() + ".py" ;
    var filename_mat  =  "data_" + now() + ".m"  ;
    var filename_csv  =  "data_" + now() + ".csv";

    $('#save_python')[0].download = filename_py;
    $('#save_python')[0].href     = "data:application/octet-stream," + encodeURIComponent(vectxt_py);

    $('#save_matlab')[0].download = filename_mat;
    $('#save_matlab')[0].href     = "data:application/octet-stream," + encodeURIComponent(vectxt_mat);

    $('#save_csv')[0].download = filename_csv;
    $('#save_csv')[0].href     = "data:application/octet-stream," + encodeURIComponent(vectxt_csv);

    save_modal.modal('show');

  }

  function showModalConfig(err_msg) {
    var config_modal = $('#modal_config');
    config_show_storage();
    $("#config_name_input").val("config_" + now() );
    config_save_file();
    config_modal.modal('show');
  }


  function startApp() {
    $.get(
      start_app_url
    )
    .done(function(dresult) {
      if(dresult.status == 'ERROR') {
        showModalError((dresult.reason ? dresult.reason : 'Could not start the application.'), true);
      }
      else {
        $.post(
          post_url,
          JSON.stringify({ datasets: { params: def_params } })
        )
        .done(function(dresult) {
          app_started = true;
          updateGraphData();
        })
        .fail(function() {
          showModalError('Could not initialize the application with default parameters.', false, true);
        });
      }
    })
    .fail(function() {
      showModalError('Could not start the application.', true);
    });
  }

  function showModalError(err_msg, retry_btn, restart_btn, ignore_btn) {
    var err_modal = $('#modal_err');

    err_modal.find('#btn_retry_get')[retry_btn ? 'show' : 'hide']();
    err_modal.find('.btn-app-restart')[restart_btn ? 'show' : 'hide']();
    err_modal.find('#btn_ignore')[ignore_btn ? 'show' : 'hide']();
    err_modal.find('.modal-body').html(err_msg);
    err_modal.modal('show');
  }

  function updateGraphData() {
    if(downloading||scope_stop) {
      return;
    }
    if(update_timer) {
      clearTimeout(update_timer);
      update_timer = null;
    }
    downloading = true;

    // Send params if there are any unsent changes
    sendParams();

    var arun_before_ajax = autorun;
    var long_timeout_used = use_long_timeout;

    $.ajax({
      url: get_url,
      timeout: (use_long_timeout ? long_timeout : request_timeout),
      cache: false
    })
    .done(function(dresult) {
      last_get_failed = false;

      if(dresult.status === 'ERROR') {
        if(! app_started) {
          startApp();
        }
        else {
          showModalError((dresult.reason ? dresult.reason : 'Application error.'), true, true);
        }
      }
      else if(dresult.datasets !== undefined && dresult.datasets.params !== undefined) {
        // Check if the application started on the server is the same as on client
        if(app_id !== dresult.app.id) {
          if(! app_started) {
            startApp();
          }
          else {
            $('#new_app_id').text(dresult.app.id);
            $('#modal_app').modal('show');
          }
          return;
        }

        app_started = true;

        // Check if trigger mode (which may switch autorun) was changed during ajax request
        var arun_after_ajax = autorun;

        datasets = [];
        for(var i=0; i<dresult.datasets.g1.length; i++) {
          dresult.datasets.g1[i].color = i;
          dresult.datasets.g1[i].label = 'Channel ' + (i+1);
          datasets.push(dresult.datasets.g1[i]);
        }

        if(! plot) {
          initPlot(dresult.datasets.params);
        }
        else {
          // Apply the params state received from server if not in edit mode
          if(! user_editing) {
            loadParams(dresult.datasets.params);

            // Restore the autorun value modified by loadParams
            if(arun_before_ajax != arun_after_ajax) {
              autorun = arun_after_ajax;
            }
          }
          // Time units must be always updated
          else {
            updateTimeUnits(dresult.datasets.params);
          }

          // Force X min/max
          if(dresult.datasets.params.forcex_flag == 1) {
            var options = plot.getOptions();
            options.xaxes[0].min = dresult.datasets.params.xmin;
            options.xaxes[0].max = dresult.datasets.params.xmax;
          }

          // Redraw the plot using new datasets
          plot.setData(filterData(datasets, plot.width()));
          plot.setupGrid();
          plot.draw();
        }

        if(! trig_dragging) {
          updateTriggerSlider();
        }

        updateRanges();

        if(autorun || dresult.status === 'AGAIN') {
          if(autorun) {
            $('#btn_single').prop('disabled', true);
          }
          update_timer = setTimeout(function() {
            updateGraphData();
          }, update_interval);
        }
        else {
          $('#btn_single').prop('disabled', false);
        }
      }
      else {
        showModalError('Wrong application data received.', true, true);
      }
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
      if(last_get_failed) {
        if(window.location.href[0]!='f')
          showModalError('Data receiving failed.<br>Error status: ' + textStatus, true, true);
        last_get_failed = false;
      }
      else {
        last_get_failed = true;
        downloading = false;
        updateGraphData();  // One more try
      }
    })
    .always(function() {
      if(! last_get_failed) {
        downloading = false;

        if(params.local) {
          // Disable trigger level input if trigger source is External or mode is not Normal
          if(params.original.trig_mode != 1 || params.original.trig_source == 2) {
            $('#trig_level').prop('disabled', true);
            if($('#trig_level').is(':focus')) {
              $('#trig_level').blur();
            }
            $('#apply_trig_level').hide().parent().removeClass('input-group');
          }
          else {
            $('#trig_level').prop('disabled', false);
          }

          // Manage the state of other components
          $('#accordion').find('input,select').not('#trig_level').prop('disabled', false);
          $('.btn').not('#btn_single, #range_y_plus, #range_y_minus, #range_x_plus, #range_x_minus, #gen_ch1_single, #gen_ch2_single, #btn_set_trig').prop('disabled', false);

          $('#bottom_panel').find('input,select').prop('disabled', false); // LOLO lock panel
          $('#leftpanel').find('input,select').prop('disabled', false); // LOLO left panel
        }
      }

      if(long_timeout_used) {
        use_long_timeout = false;
      }
    });
  }

  function initPlot(init_params) {
    var plot_holder = $('#plot_holder');
    var ymax = init_params.gui_reset_y_range / 2;
    var ymin = ymax * -1;

    // Load received params
    loadParams(init_params);

    // When xmin/xmax are null, the min/max values of received data will be used. For ymin/ymax use the gui_reset_y_range param.
    $.extend(true, plot_options, {
      xaxis: { min: null, max: null },
      yaxis: { min: ymin, max: ymax }
    });

    // Local optimization
    var filtered_data = filterData(datasets, plot_holder.width());

    // Plot first creation and drawing
    plot = $.plot(
      plot_holder,
      filtered_data,
      plot_options
    );

    // Selection
    plot_holder.on('plotselected', function(event, ranges) {

      // Clamp the zooming to prevent eternal zoom
      if(ranges.xaxis.to - ranges.xaxis.from < 0.00001) {
        ranges.xaxis.to = ranges.xaxis.from + 0.00001;
      }
      if(ranges.yaxis.to - ranges.yaxis.from < 0.00001) {
        ranges.yaxis.to = ranges.yaxis.from + 0.00001;
      }

      // Do the zooming
      plot = $.plot(
        plot_holder,
        getData(ranges.xaxis.from, ranges.xaxis.to),
        $.extend(true, plot_options, {
          xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to },
          yaxis: { min: ranges.yaxis.from, max: ranges.yaxis.to }
        })
      );

      params.local.xmin = parseFloat(ranges.xaxis.from.toFixed(xdecimal_places));
      params.local.xmax = parseFloat(ranges.xaxis.to.toFixed(xdecimal_places));

      updateTriggerSlider();
      sendParams(true);
    });

    // Zoom / Pan
    plot_holder.on('plotzoom plotpan touchmove touchend', function(event) {

      if(zoompan_timer) {
        clearTimeout(zoompan_timer);
        zoompan_timer = null;
      }

      zoompan_timer = setTimeout(function() {
        zoompan_timer = null;

        var xaxis = plot.getAxes().xaxis;
        params.local.xmin = parseFloat(xaxis.min.toFixed(xdecimal_places));
        params.local.xmax = parseFloat(xaxis.max.toFixed(xdecimal_places));

        updateTriggerSlider();
        sendParams(true);

      }, 250);
    });
  }

  function onDropdownChange(that, param_name, do_get) {

    if ( $.inArray( param_name, [ 'lock_pidA_PSR', 'lock_pidA_ISR', 'lock_pidA_DSR', 'lock_pidA_SAT' ] )>-1 ) lock_pidA_update() ;
    if ( $.inArray( param_name, [ 'lock_pidB_PSR', 'lock_pidB_ISR', 'lock_pidB_DSR', 'lock_pidB_SAT' ] )>-1 ) lock_pidB_update() ;
    if ( $.inArray( param_name, [ 'lock_lpf_F1_tau', 'lock_lpf_F1_order', 'lock_lpf_F2_tau', 'lock_lpf_F2_order', 'lock_lpf_F3_tau', 'lock_lpf_F3_order', 'lock_lpf_sq_tau', 'lock_lpf_sq_order' ] )>-1 ) lpf_update();

    params.local[param_name] = parseInt(that.val());
    sendParams(do_get);
    that.blur();
    user_editing = false;
  }

  function loadParams(orig_params) {
    if(! $.isPlainObject(orig_params)) {
      return;
    }

    // Ignore xmin/xmax values received from server. That values must be used only on AUTO button click
    // and on ForceX flag, but that is done before the sendParams() function is called.
    if(plot) {
      var options = plot.getOptions();
      if(options.xaxes[0].min && options.xaxes[0].max) {
        orig_params.xmin = options.xaxes[0].min;
        orig_params.xmax = options.xaxes[0].max;
      }
      // LOLO
      if(trigger_just_set) {
        orig_params.lock_lock_trig_val      = params.local.lock_lock_trig_val      ;
        orig_params.lock_lock_trig_time_val = params.local.lock_lock_trig_time_val ;
        //orig_params.lock_ctrl_aux_lock_trig_rise     = params.local.lock_ctrl_aux_lock_trig_rise     ;
        trigger_just_set=false;
      }
      if(orig_params.lock_lock_control!=orig_params.lock_lock_feedback)
        orig_params.lock_lock_control=orig_params.lock_lock_feedback;
    }



    // Same data in local and original params
    params.original = $.extend({}, orig_params);
    params.local = $.extend({}, params.original);

    // Autorun if trigger mode is Auto(0) or Normal(1), stop if it is Single(2)
    autorun = (params.original.trig_mode == 2 ? 0 : 1);

    // Enable the Single button when not in autorun mode
    $('#btn_single').prop('disabled', autorun);

    $('#trig_mode').val(params.original.trig_mode);
    $('#trig_source').val(params.original.trig_source);
    $('#trig_edge').val(params.original.trig_edge);
    var scale = (params.original.trig_source == 0 ? params.original.scale_ch1 : params.original.scale_ch2);
    $('#trig_level').val(floatToLocalString(params.original.trig_level * scale));

    if ((refresh_counter++ % meas_panel_dec) == 0) {
        $('#info_ch1_min').html(floatToLocalString(shortenFloat(params.original.meas_min_ch1)));
        $('#info_ch1_max').html(floatToLocalString(shortenFloat(params.original.meas_max_ch1)));
        $('#info_ch1_amp').html(floatToLocalString(shortenFloat(params.original.meas_amp_ch1)));
        $('#info_ch1_avg').html(floatToLocalString(shortenFloat(params.original.meas_avg_ch1)));
        $('#info_ch1_freq').html(convertHz(params.original.meas_freq_ch1));
        $('#info_ch1_period').html(convertSec(params.original.meas_per_ch1));

        $('#info_ch2_min').html(floatToLocalString(shortenFloat(params.original.meas_min_ch2)));
        $('#info_ch2_max').html(floatToLocalString(shortenFloat(params.original.meas_max_ch2)));
        $('#info_ch2_amp').html(floatToLocalString(shortenFloat(params.original.meas_amp_ch2)));
        $('#info_ch2_avg').html(floatToLocalString(shortenFloat(params.original.meas_avg_ch2)));
        $('#info_ch2_freq').html(convertHz(params.original.meas_freq_ch2));
        $('#info_ch2_period').html(convertSec(params.original.meas_per_ch2));
    }

    $('#gain_ch1_att').val(params.original.prb_att_ch1);
    $('#gain_ch1_sett').val(params.original.gain_ch1);
    $('#gain_ch2_att').val(params.original.prb_att_ch2);
    $('#gain_ch2_sett').val(params.original.gain_ch2);

    $('#gen_enable_ch1').prop('checked', (params.original.gen_enable_ch1 ? true : false));
    $('#gen_enable_ch2').prop('checked', (params.original.gen_enable_ch2 ? true : false));

    $('#gen_ch1_sigtype').val(params.original.gen_sig_type_ch1);
    $('#gen_ch1_ampl').val(floatToLocalString(params.original.gen_sig_amp_ch1));
    $('#gen_ch1_freq').val(floatToLocalString(params.original.gen_sig_freq_ch1));
    $('#gen_ch1_dc').val(floatToLocalString(params.original.gen_sig_dcoff_ch1));
    $('#gen_ch1_trigmode').val(params.original.gen_trig_mod_ch1);

    $('#gen_ch2_sigtype').val(params.original.gen_sig_type_ch2);
    $('#gen_ch2_ampl').val(floatToLocalString(params.original.gen_sig_amp_ch2));
    $('#gen_ch2_freq').val(floatToLocalString(params.original.gen_sig_freq_ch2));
    $('#gen_ch2_dc').val(floatToLocalString(params.original.gen_sig_dcoff_ch2));
    $('#gen_ch2_trigmode').val(params.original.gen_trig_mod_ch2);

    $('#gen_ch1_single').prop('disabled', (params.original.gen_trig_mod_ch1 == 1 ? false : true));
    $('#gen_ch2_single').prop('disabled', (params.original.gen_trig_mod_ch2 == 1 ? false : true));




    $('#pid_11_enable').prop('checked', (params.original.pid_11_enable ? true : false));
    $('#pid_12_enable').prop('checked', (params.original.pid_12_enable ? true : false));
    $('#pid_21_enable').prop('checked', (params.original.pid_21_enable ? true : false));
    $('#pid_22_enable').prop('checked', (params.original.pid_22_enable ? true : false));

    $('#pid_11_rst').prop('checked', (params.original.pid_11_rst ? true : false));
    $('#pid_12_rst').prop('checked', (params.original.pid_12_rst ? true : false));
    $('#pid_21_rst').prop('checked', (params.original.pid_21_rst ? true : false));
    $('#pid_22_rst').prop('checked', (params.original.pid_22_rst ? true : false));

    $('#pid_11_sp').val(params.original.pid_11_sp);
    $('#pid_11_kp').val(params.original.pid_11_kp);
    $('#pid_11_ki').val(params.original.pid_11_ki);
    $('#pid_11_kd').val(params.original.pid_11_kd);
    $('#pid_12_sp').val(params.original.pid_12_sp);
    $('#pid_12_kp').val(params.original.pid_12_kp);
    $('#pid_12_ki').val(params.original.pid_12_ki);
    $('#pid_12_kd').val(params.original.pid_12_kd);
    $('#pid_21_sp').val(params.original.pid_21_sp);
    $('#pid_21_kp').val(params.original.pid_21_kp);
    $('#pid_21_ki').val(params.original.pid_21_ki);
    $('#pid_21_kd').val(params.original.pid_21_kd);
    $('#pid_22_sp').val(params.original.pid_22_sp);
    $('#pid_22_kp').val(params.original.pid_22_kp);
    $('#pid_22_ki').val(params.original.pid_22_ki);
    $('#pid_22_kd').val(params.original.pid_22_kd);



    if(params.original.en_avg_at_dec) {
      $('#btn_avg').removeClass('btn-default').addClass('btn-primary');
    }
    else {
      $('#btn_avg').removeClass('btn-primary').addClass('btn-default');
    }


    /*
    $('#lock_lpf_F1_tau').val( params.original.lock_lpf_F1 % 16 );
    $('#lock_lpf_F2_tau').val( params.original.lock_lpf_F2 % 16 );
    $('#lock_lpf_F3_tau').val( params.original.lock_lpf_F3 % 16 );
    $('#lock_lpf_sq_tau').val( params.original.lock_lpf_sq % 16 );

    $('#lock_lpf_F1_order').val( params.original.lock_lpf_F1_order % 4 );
    $('#lock_lpf_F2_order').val( params.original.lock_lpf_F2_order % 4 );
    $('#lock_lpf_F3_order').val( params.original.lock_lpf_F3_order % 4 );
    $('#lock_lpf_sq_order').val( params.original.lock_lpf_sq_order % 4 );


    $('#lock_ctrl_aux_set_pidA_enable').prop('checked', (params.original.lock_ctrl_aux_set_pidA_enable ? true : false));
    $('#lock_ctrl_aux_set_pidB_enable').prop('checked', (params.original.lock_ctrl_aux_set_pidB_enable ? true : false));
    $('#lock_ctrl_aux_set_ramp_enable').prop('checked', (params.original.lock_ctrl_aux_set_ramp_enable ? true : false));

    if (params.original.lock_ctrl_aux_ramp_enable_ctrl)
      $('#lock_ctrl_aux_ramp_enable_ctrl').removeClass('btn-default').addClass('btn-primary');
    else
      $('#lock_ctrl_aux_ramp_enable_ctrl').removeClass('btn-primary').addClass('btn-default');

    if (params.original.lock_ctrl_aux_pidA_enable_ctrl)
      $('#lock_ctrl_aux_pidA_enable_ctrl').removeClass('btn-default').addClass('btn-primary');
    else
      $('#lock_ctrl_aux_pidA_enable_ctrl').removeClass('btn-primary').addClass('btn-default');

    if (params.original.lock_ctrl_aux_pidB_enable_ctrl)
      $('#lock_ctrl_aux_pidB_enable_ctrl').removeClass('btn-default').addClass('btn-primary');
    else
      $('#lock_ctrl_aux_pidB_enable_ctrl').removeClass('btn-primary').addClass('btn-default');

    if (params.original.lock_ctrl_aux_lock_now)
      $('#lock_ctrl_aux_lock_now').removeClass('btn-default').addClass('btn-primary');
    else
      $('#lock_ctrl_aux_lock_now').removeClass('btn-primary').addClass('btn-default');

    if (params.original.lock_ctrl_aux_launch_lock_trig)
      $('#lock_ctrl_aux_launch_lock_trig').removeClass('btn-default').addClass('btn-primary');
    else
      $('#lock_ctrl_aux_launch_lock_trig').removeClass('btn-primary').addClass('btn-default');

    $('#lock_ctrl_aux_trig_type').val(params.original.lock_ctrl_aux_trig_type);
    */

    // [LOLO DOCK LOADPARAMS]
    // Checkboxes
    $('#lock_osc1_filt_off'           ).prop('checked', (params.original.lock_osc1_filt_off               ? true : false));
    $('#lock_osc2_filt_off'           ).prop('checked', (params.original.lock_osc2_filt_off               ? true : false));
    $('#lock_rl_error_enable'         ).prop('checked', (params.original.lock_rl_error_enable             ? true : false));
    $('#lock_rl_signal_enable'        ).prop('checked', (params.original.lock_rl_signal_enable            ? true : false));
    $('#lock_rl_reset'                ).prop('checked', (params.original.lock_rl_reset                    ? true : false));
    $('#lock_sf_AfrzO'                ).prop('checked', (params.original.lock_sf_AfrzO                    ? true : false));
    $('#lock_sf_AfrzI'                ).prop('checked', (params.original.lock_sf_AfrzI                    ? true : false));
    $('#lock_sf_BfrzO'                ).prop('checked', (params.original.lock_sf_BfrzO                    ? true : false));
    $('#lock_sf_BfrzI'                ).prop('checked', (params.original.lock_sf_BfrzI                    ? true : false));
    $('#lock_ramp_reset'              ).prop('checked', (params.original.lock_ramp_reset                  ? true : false));
    $('#lock_ramp_enable'             ).prop('checked', (params.original.lock_ramp_enable                 ? true : false));
    $('#lock_ramp_direction'          ).prop('checked', (params.original.lock_ramp_direction              ? true : false));
    $('#lock_pidA_irst'               ).prop('checked', (params.original.lock_pidA_irst                   ? true : false));
    $('#lock_pidA_freeze'             ).prop('checked', (params.original.lock_pidA_freeze                 ? true : false));
    $('#lock_pidA_ifreeze'            ).prop('checked', (params.original.lock_pidA_ifreeze                ? true : false));
    $('#lock_pidB_irst'               ).prop('checked', (params.original.lock_pidB_irst                   ? true : false));
    $('#lock_pidB_freeze'             ).prop('checked', (params.original.lock_pidB_freeze                 ? true : false));
    $('#lock_pidB_ifreeze'            ).prop('checked', (params.original.lock_pidB_ifreeze                ? true : false));
    $('#lock_ctrl_aux_set_pidB_enable').prop('checked', (params.original.lock_ctrl_aux_set_pidB_enable    ? true : false));
    $('#lock_ctrl_aux_set_pidA_enable').prop('checked', (params.original.lock_ctrl_aux_set_pidA_enable    ? true : false));
    $('#lock_ctrl_aux_set_ramp_enable').prop('checked', (params.original.lock_ctrl_aux_set_ramp_enable    ? true : false));
    $('#lock_ctrl_aux_lock_trig_rise' ).prop('checked', (params.original.lock_ctrl_aux_lock_trig_rise     ? true : false));

    // Numbers
    $('#lock_lock_trig_val'      ).val(params.original.lock_lock_trig_val         );
    $('#lock_lock_trig_time_val' ).val(params.original.lock_lock_trig_time_val    );
    $('#lock_rl_error_threshold' ).val(params.original.lock_rl_error_threshold    );
    $('#lock_rl_signal_threshold').val(params.original.lock_rl_signal_threshold   );
    $('#lock_sf_jumpA'           ).val(params.original.lock_sf_jumpA              );
    $('#lock_sf_jumpB'           ).val(params.original.lock_sf_jumpB              );
    $('#lock_error_offset'       ).val(params.original.lock_error_offset          );
    $('#lock_gen_mod_phase'      ).val(params.original.lock_gen_mod_phase         );
    $('#lock_gen_mod_phase_sq'   ).val(params.original.lock_gen_mod_phase_sq      );
    $('#lock_gen_mod_hp'         ).val(params.original.lock_gen_mod_hp            );
    $('#lock_gen_mod_sqp'        ).val(params.original.lock_gen_mod_sqp           );
    $('#lock_ramp_step'          ).val(params.original.lock_ramp_step             );
    $('#lock_ramp_low_lim'       ).val(params.original.lock_ramp_low_lim          );
    $('#lock_ramp_hig_lim'       ).val(params.original.lock_ramp_hig_lim          );
    $('#lock_ramp_B_factor'      ).val(params.original.lock_ramp_B_factor         );
    $('#lock_pidA_sp'            ).val(params.original.lock_pidA_sp               );
    $('#lock_pidA_kp'            ).val(params.original.lock_pidA_kp               );
    $('#lock_pidA_ki'            ).val(params.original.lock_pidA_ki               );
    $('#lock_pidA_kd'            ).val(params.original.lock_pidA_kd               );
    $('#lock_pidB_sp'            ).val(params.original.lock_pidB_sp               );
    $('#lock_pidB_kp'            ).val(params.original.lock_pidB_kp               );
    $('#lock_pidB_ki'            ).val(params.original.lock_pidB_ki               );
    $('#lock_pidB_kd'            ).val(params.original.lock_pidB_kd               );
    $('#lock_aux_A'              ).val(params.original.lock_aux_A                 );
    $('#lock_aux_B'              ).val(params.original.lock_aux_B                 );

    // Switches
    $('#lock_oscA_sw'           ).val(params.original.lock_oscA_sw              );
    $('#lock_oscB_sw'           ).val(params.original.lock_oscB_sw              );
    $('#lock_trig_sw'           ).val(params.original.lock_trig_sw              );
    $('#lock_out1_sw'           ).val(params.original.lock_out1_sw              );
    $('#lock_out2_sw'           ).val(params.original.lock_out2_sw              );
    $('#lock_slow_out1_sw'      ).val(params.original.lock_slow_out1_sw         );
    $('#lock_slow_out2_sw'      ).val(params.original.lock_slow_out2_sw         );
    $('#lock_slow_out3_sw'      ).val(params.original.lock_slow_out3_sw         );
    $('#lock_slow_out4_sw'      ).val(params.original.lock_slow_out4_sw         );
    $('#lock_lock_trig_sw'      ).val(params.original.lock_lock_trig_sw         );
    $('#lock_rl_signal_sw'      ).val(params.original.lock_rl_signal_sw         );
    $('#lock_signal_sw'         ).val(params.original.lock_signal_sw            );
    $('#lock_sg_amp1'           ).val(params.original.lock_sg_amp1              );
    $('#lock_sg_amp2'           ).val(params.original.lock_sg_amp2              );
    $('#lock_sg_amp3'           ).val(params.original.lock_sg_amp3              );
    $('#lock_sg_amp_sq'         ).val(params.original.lock_sg_amp_sq            );
    $('#lock_lpf_F1_tau'        ).val(params.original.lock_lpf_F1_tau           );
    $('#lock_lpf_F1_order'      ).val(params.original.lock_lpf_F1_order         );
    $('#lock_lpf_F2_tau'        ).val(params.original.lock_lpf_F2_tau           );
    $('#lock_lpf_F2_order'      ).val(params.original.lock_lpf_F2_order         );
    $('#lock_lpf_F3_tau'        ).val(params.original.lock_lpf_F3_tau           );
    $('#lock_lpf_F3_order'      ).val(params.original.lock_lpf_F3_order         );
    $('#lock_lpf_sq_tau'        ).val(params.original.lock_lpf_sq_tau           );
    $('#lock_lpf_sq_order'      ).val(params.original.lock_lpf_sq_order         );
    $('#lock_error_sw'          ).val(params.original.lock_error_sw             );
    $('#lock_read_ctrl'         ).val(params.original.lock_read_ctrl            );
    $('#lock_pidA_sw'           ).val(params.original.lock_pidA_sw              );
    $('#lock_pidA_PSR'          ).val(params.original.lock_pidA_PSR             );
    $('#lock_pidA_ISR'          ).val(params.original.lock_pidA_ISR             );
    $('#lock_pidA_DSR'          ).val(params.original.lock_pidA_DSR             );
    $('#lock_pidA_SAT'          ).val(params.original.lock_pidA_SAT             );
    $('#lock_pidB_sw'           ).val(params.original.lock_pidB_sw              );
    $('#lock_pidB_PSR'          ).val(params.original.lock_pidB_PSR             );
    $('#lock_pidB_ISR'          ).val(params.original.lock_pidB_ISR             );
    $('#lock_pidB_DSR'          ).val(params.original.lock_pidB_DSR             );
    $('#lock_pidB_SAT'          ).val(params.original.lock_pidB_SAT             );
    $('#lock_ctrl_aux_trig_type').val(params.original.lock_ctrl_aux_trig_type   );

    // Buttons
    if (params.original.lock_osc_raw_mode){                 // lock_osc_raw_mode
      $('#lock_osc_raw_mode').removeClass('btn-default').addClass('btn-primary').data('checked',true);
    }else{
      $('#lock_osc_raw_mode').removeClass('btn-primary').addClass('btn-default').data('checked',false);
    }
    if (params.original.lock_osc_lockin_mode){              // lock_osc_lockin_mode
      $('#lock_osc_lockin_mode').removeClass('btn-default').addClass('btn-primary').data('checked',true);
    }else{
      $('#lock_osc_lockin_mode').removeClass('btn-primary').addClass('btn-default').data('checked',false);
    }
    if (params.original.lock_sf_start){                     // lock_sf_start
      $('#lock_sf_start').removeClass('btn-default').addClass('btn-primary').data('checked',true);
    }else{
      $('#lock_sf_start').removeClass('btn-primary').addClass('btn-default').data('checked',false);
    }
    if (params.original.lock_ctrl_aux_lock_now){            // lock_ctrl_aux_lock_now
      $('#lock_ctrl_aux_lock_now').removeClass('btn-default').addClass('btn-primary').data('checked',true);
    }else{
      $('#lock_ctrl_aux_lock_now').removeClass('btn-primary').addClass('btn-default').data('checked',false);
    }
    if (params.original.lock_ctrl_aux_launch_lock_trig){    // lock_ctrl_aux_launch_lock_trig
      $('#lock_ctrl_aux_launch_lock_trig').removeClass('btn-default').addClass('btn-primary').data('checked',true);
    }else{
      $('#lock_ctrl_aux_launch_lock_trig').removeClass('btn-primary').addClass('btn-default').data('checked',false);
    }
    if (params.original.lock_ctrl_aux_pidB_enable_ctrl){    // lock_ctrl_aux_pidB_enable_ctrl
      $('#lock_ctrl_aux_pidB_enable_ctrl').removeClass('btn-default').addClass('btn-primary').data('checked',true);
    }else{
      $('#lock_ctrl_aux_pidB_enable_ctrl').removeClass('btn-primary').addClass('btn-default').data('checked',false);
    }
    if (params.original.lock_ctrl_aux_pidA_enable_ctrl){    // lock_ctrl_aux_pidA_enable_ctrl
      $('#lock_ctrl_aux_pidA_enable_ctrl').removeClass('btn-default').addClass('btn-primary').data('checked',true);
    }else{
      $('#lock_ctrl_aux_pidA_enable_ctrl').removeClass('btn-primary').addClass('btn-default').data('checked',false);
    }
    if (params.original.lock_ctrl_aux_ramp_enable_ctrl){    // lock_ctrl_aux_ramp_enable_ctrl
      $('#lock_ctrl_aux_ramp_enable_ctrl').removeClass('btn-default').addClass('btn-primary').data('checked',true);
    }else{
      $('#lock_ctrl_aux_ramp_enable_ctrl').removeClass('btn-primary').addClass('btn-default').data('checked',false);
    }
    if (params.original.lock_mod_sq_on){                    // lock_mod_sq_on
      $('#lock_mod_sq_on').removeClass('btn-default').addClass('btn-primary').data('checked',true);
    }else{
      $('#lock_mod_sq_on').removeClass('btn-primary').addClass('btn-default').data('checked',false);
    }
    if (params.original.lock_mod_harmonic_on){              // lock_mod_harmonic_on
      $('#lock_mod_harmonic_on').removeClass('btn-default').addClass('btn-primary').data('checked',true);
    }else{
      $('#lock_mod_harmonic_on').removeClass('btn-primary').addClass('btn-default').data('checked',false);
    }

    // [LOLO DOCK LOADPARAMS END]


    lock_ramp_step_update();
    lock_modulation_update();
    lock_ctrl_update();
    lock_pidA_update();
    lock_pidB_update();
    lpf_update();
    display_update();

    updateTimeUnits(orig_params);
    $('#ytitle').show();

  }

  function updateTimeUnits(new_params) {
    if(! $.isPlainObject(new_params)) {
      return;
    }

    params.original.time_units = params.local.time_units = new_params.time_units;

    var timeu_lbl = (params.original.time_units == 0 ? 'μs' : (params.original.time_units == 1 ? 'ms' : 's'));
    $('#xtitle').text('Time [ ' + timeu_lbl + ' ]');
  }

  function isParamChanged() {
    if(params.original) {
      for(var key in params.original) {
        if(params.original[key] != params.local[key]) {
          return true;
        }
      }
    }
    return false;
  }

  function sendParams(refresh_data, force_send, single_btn) {
    if(sending || (force_send !== true && !isParamChanged())) {
      send_que = sending;
      return;
    }

    var auto_flag = params.local.auto_flag;  // Keep the value of auto_flag, because in POST response it is always 0
    sending = true;
    params.local.single_btn = (single_btn === true ? 1 : 0);
    use_long_timeout = !!auto_flag;

    $.ajax({
      type: 'POST',
      url: post_url,
      data: JSON.stringify({ datasets: { params: params.local } }),
      timeout: (use_long_timeout ? long_timeout : request_timeout),
      cache: false
    })
    .done(function(dresult) {
      // OK: Load the params received as POST result
      if(dresult.datasets !== undefined && dresult.datasets.params !== undefined) {

        // Use the provided min/max values only once after AUTO button was clicked
        if(auto_flag == 1 && dresult.datasets.params.min_y !== dresult.datasets.params.max_y) {
          var options = plot.getOptions();

          options.xaxes[0].min = dresult.datasets.params.xmin;
          options.xaxes[0].max = dresult.datasets.params.xmax;
          options.yaxes[0].min = dresult.datasets.params.min_y;
          options.yaxes[0].max = dresult.datasets.params.max_y;

          // Enable both channels after click on AUTO button
          if(!$('#btn_ch1').data('checked') || !$('#btn_ch2').data('checked')) {
            $('#btn_ch1').data('checked', true).removeClass('btn-default').addClass('btn-primary');
            $('#btn_ch2').data('checked', true).removeClass('btn-default').addClass('btn-primary');
            redrawPlot();
          }
          // Both channels are already active, do a quick redraw
          else {
            plot.setupGrid();
            plot.draw();
          }
        }

        if(auto_flag == 0 && dresult.datasets.params.forcex_flag == 1) {
          var options = plot.getOptions();

          options.xaxes[0].min = dresult.datasets.params.xmin;
          options.xaxes[0].max = dresult.datasets.params.xmax;

          plot.setupGrid();
          plot.draw();
        }

        loadParams(dresult.datasets.params);
        updateTriggerSlider();

        if(refresh_data && !downloading) {
          updateGraphData();
        }
      }
      else if(dresult.status == 'ERROR') {
        showModalError((dresult.reason ? dresult.reason : 'Error while sending data (E1).'), false, true, true);
        send_que = false;
      }
      else {
        showModalError('Error while sending data (E2).', false, true, true);
      }
    })
    .fail(function() {
      showModalError('Error while sending data (E3).', false, true, true);
    })
    .always(function() {
      sending = false;
      user_editing = false;

      if(send_que) {
        send_que = false;
        setTimeout(function(refresh_data) {
          sendParams(refresh_data);
        }, 100);
      }
    });
  }

  function getData(from, to) {
    var rangedata = new Array();
    for(var i=0; i<datasets.length; i++) {
      if(! $('#btn_ch' + (i+1)).data('checked')) {
        continue;
      }
      rangedata.push({ color: datasets[i].color, label: datasets[i].label, data: [] });
      for(var j=0; j<datasets[i].data.length; j++) {
        if(datasets[i].data[j][0] > to) {
          break;
        }
        if(datasets[i].data[j][0] >= from) {
          rangedata[rangedata.length - 1].data.push(datasets[i].data[j]);
        }
      }
    }
    rangedata = filterData(rangedata, (plot ? plot.width() : $('plot_holder').width()));
    return rangedata;
  }

  // Use only data for selected channels and do downsamling (data decimation), which is required for
  // better performance. On the canvas cannot be shown too much graph points.
  function filterData(dsets, points) {
    var filtered = [];
    var num_of_channels = 2;

    for(var l=0; l<num_of_channels; l++) {
      if(! $('#btn_ch' + (l+1)).data('checked')) {
        continue;
      }

      i = Math.min(l, dsets.length - 1);

      filtered.push({ color: dsets[i].color, label: dsets[i].label, data: [] });

      if(points_per_px === null || dsets[i].data.length > points * points_per_px) {
        var step = Math.ceil(dsets[i].data.length / (points * points_per_px));
        var k = 0;
        for(var j=0; j<dsets[i].data.length; j++) {
          if(k > 0 && ++k < step) {
            continue;
          }
          filtered[filtered.length - 1].data.push(dsets[i].data[j]);
          k = 1;
        }
      }
      else {
        filtered[filtered.length - 1].data = dsets[i].data.slice(0);
      }
    }

    filtered = addTriggerDataSet(filtered);
    return filtered;
  }

  // Add a data series for the trigger level line
  function addTriggerDataSet(dsets) {

    // Transform trigger level to real values
    var scale = (params.local.trig_source == 0 ? params.local.scale_ch1 : params.local.scale_ch2);
    var tlev = params.local.trig_level * scale;

    // Don't add trigger dataset if trigger level is outside the visible area...
    if(plot) {
      var yaxis = plot.getAxes().yaxis;
      if(tlev < yaxis.min || tlev > yaxis.max) {
        return dsets;
      }
    }
    // ...or trigger mode is not Normal
    if(params.local.trig_mode != 1) {
      return dsets;
    }
    // ...or trigger source is external
    if(params.local.trig_source == 2) {
      return dsets;
    }
    // ...or outside of received data for Y axis
    var ch1ymin = null,
        ch1ymax = null;
    // Find Y min/max values from data for first visible channel
    for(var i=0; i<dsets[0].data.length; i++) {
      ch1ymin = (ch1ymin === null || ch1ymin > dsets[0].data[i][1] ? dsets[0].data[i][1] : ch1ymin);
      ch1ymax = (ch1ymax === null || ch1ymax < dsets[0].data[i][1] ? dsets[0].data[i][1] : ch1ymax);
    }
    if(dsets.length > 1) {
      var ch2ymin = null,
          ch2ymax = null;
      // Find Y min/max values from data for second visible channel
      for(var i=0; i<dsets[1].data.length; i++) {
        ch2ymin = (ch2ymin === null || ch2ymin > dsets[1].data[i][1] ? dsets[1].data[i][1] : ch2ymin);
        ch2ymax = (ch2ymax === null || ch2ymax < dsets[1].data[i][1] ? dsets[1].data[i][1] : ch2ymax);
      }
      // Check if trigger level is outside of found values
      if(tlev < Math.min(ch1ymin, ch2ymin) || tlev > Math.max(ch1ymax, ch2ymax)) {
        return dsets;
      }
    }
    else {
      // Check if trigger level is outside of found values
      if(tlev < ch1ymin || tlev > ch1ymax) {
        return dsets;
      }
    }

    var index = 0;
    var dxmin = 0;
    var dxmax = 1;

    if(dsets.length && dsets[0].data[0]) {
      index = dsets.length;

      dxmin = dsets[0].data[0][0];
      dxmax = dsets[0].data[dsets[0].data.length - 1][0];
    }
    dsets[index] = { color: 2, data: [[dxmin, tlev], [dxmax, tlev]], shadowSize: 1 };

    return dsets;
  }

  function runStop() {
    if(autorun) {
      $('#btn_single').prop('disabled', true);
      updateGraphData();
    }
    else {
      $('#btn_single').prop('disabled', false);
      if(update_timer) {
        clearTimeout(update_timer);
        update_timer = null;
      }
    }
  }

  function singleUpdate() {
    if(! autorun) {
      sendParams(true, true, true);
    }
  }

  function redrawPlot() {
    if(! downloading) {
      if(! plot) {
        updateGraphData();
      }
      else {
        var options = plot.getOptions();
        plot = $.plot(
          plot.getPlaceholder(),
          filterData(datasets, plot.width()),
          $.extend(true, plot_options, {
            xaxis: { min: options.xaxes[0].min, max: options.xaxes[0].max },
            yaxis: { min: options.yaxes[0].min, max: options.yaxes[0].max }
          })
        );
        updateTriggerSlider();
      }
    }
  }

  function setVisibleChannels(btn) {
    var other_btn = $(btn.id == 'btn_ch1' ? '#btn_ch2' : '#btn_ch1');
    var btn = $(btn);
    var checked = !btn.data('checked');

    btn.data('checked', checked).toggleClass('btn-default btn-primary');

    // At least one button must be checked, so that at least one graph will be visible.
    if(! checked) {
      other_btn.data('checked', true).removeClass('btn-default').addClass('btn-primary');
    }
    redrawPlot();
  }

  function autoscaleY() {
    if(! plot) {
      return;
    }

    var options = plot.getOptions();
    var axes = plot.getAxes();

    // Set Y scale to data min/max + 10%
    options.yaxes[0].min = (axes.yaxis.datamin < 0 ? axes.yaxis.datamin * 1.1 : axes.yaxis.datamin - axes.yaxis.datamin * 0.1);
    options.yaxes[0].max = (axes.yaxis.datamax > 0 ? axes.yaxis.datamax * 1.1 : axes.yaxis.datamax + axes.yaxis.datamax * 0.1);

    plot.setupGrid();
    plot.draw();

    updateRanges();
    updateTriggerSlider();
  }

  function setAvgAtDec() {
    if(! plot) {
      return;
    }

    $('#btn_avg').toggleClass('btn-default btn-primary');

    if($('#btn_avg').hasClass('btn-primary')) {
      params.local.en_avg_at_dec = 1;
    }
    else{
      params.local.en_avg_at_dec = 0;
    }

    sendParams(true, true);
  }

  function resetZoom() {
    if(! plot) {
      return;
    }

    $('#btn_ch1, #btn_ch2').data('checked', true).removeClass('btn-default').addClass('btn-primary');

    var ymax = params.original.gui_reset_y_range / 2;
    var ymin = ymax * -1;

    $.extend(true, plot_options, {
      xaxis: { min: null, max: null },
      yaxis: { min: ymin, max: ymax }
    });

    var options = plot.getOptions();
    options.xaxes[0].min = null;
    options.xaxes[0].max = null;
    options.yaxes[0].min = ymin;
    options.yaxes[0].max = ymax;

    plot.setupGrid();
    plot.draw();

    params.local.xmin = xmin;
    params.local.xmax = xmax;

    sendParams(true, true);
  }

  function updateZoom() {
    if(! plot) {
      return;
    }

    params.local.xmin = 0;
    params.local.xmax = time_range_max[params.local.time_range];

    var axes = plot.getAxes();
    var options = plot.getOptions();

    options.xaxes[0].min = params.local.xmin;
    options.xaxes[0].max = params.local.xmax;
    options.yaxes[0].min = axes.yaxis.min;
    options.yaxes[0].max = axes.yaxis.max;

    plot.setupGrid();
    plot.draw();

    sendParams(true, true);
  }

  function selectTool(toolname) {
    $('#selzoompan .btn').removeClass('btn-primary').addClass('btn-default');
    $(this).toggleClass('btn-default btn-primary');

    if(toolname == 'zoomin') {
      enableZoomInSelection();
    }
    if(toolname == 'zoomout') {
      enableZoomOut();
    }
    else if(toolname == 'pan') {
      enablePanning();
    }
  }

  function enableZoomInSelection() {
    if(plot_options.hasOwnProperty('selection')) {
      return;
    }

    var plot_pholder = plot.getPlaceholder();

    // Disable panning and zoom out
    delete plot_options.pan;
    plot_pholder.off('click.rp');

    // Get current min/max for both axes to use them to fix the current view
    var axes = plot.getAxes();

    plot = $.plot(
      plot_pholder,
      plot.getData(),
      $.extend(true, plot_options, {
        selection: { mode: 'xy' },
        xaxis: { min: axes.xaxis.min, max: axes.xaxis.max },
        yaxis: { min: axes.yaxis.min, max: axes.yaxis.max }
      })
    );
  }

  function enableZoomOut() {
    var plot_pholder = plot.getPlaceholder();

    plot_pholder.on('click.rp', function(event) {
      var offset = $(event.target).offset();

      plot.zoomOut({
        center: { left: event.pageX - offset.left, top: event.pageY - offset.top },
        amount: 1.2
      });
    });

    // Disable zoom in selection and panning
    delete plot_options.selection;
    delete plot_options.pan;

    // Get current min/max for both axes to use them to fix the current view
    var axes = plot.getAxes();

    plot = $.plot(
      plot_pholder,
      plot.getData(),
      $.extend(true, plot_options, {
        xaxis: { min: axes.xaxis.min, max: axes.xaxis.max },
        yaxis: { min: axes.yaxis.min, max: axes.yaxis.max }
      })
    );
  }

  function enablePanning() {
    if(plot_options.hasOwnProperty('pan')) {
      return;
    }

    var plot_pholder = plot.getPlaceholder();

    // Disable selection zooming and zoom out
    delete plot_options.selection;
    plot_pholder.off('click.rp');

    // Get current min/max for both axes to use them to fix the current view
    var axes = plot.getAxes();

    plot = $.plot(
      plot_pholder,
      plot.getData(),
      $.extend(true, plot_options, {
        pan: { interactive: true },
        xaxis: { min: axes.xaxis.min, max: axes.xaxis.max },
        yaxis: { min: axes.yaxis.min, max: axes.yaxis.max }
      })
    );
  }

  function mouseDownMove(that, evt) {
    var y;
    user_editing = true;

    if(evt.type.indexOf('touch') > -1) {
      y = evt.originalEvent.touches[0].clientY - that.getBoundingClientRect().top - plot.getPlotOffset().top;
      touch_last_y = y;
    }
    else {
      y = evt.clientY - that.getBoundingClientRect().top - plot.getPlotOffset().top;
    }
    updateTriggerSlider(y);

    $('#trigger_tooltip').data('bs.tooltip').options.title = plot.getAxes().yaxis.c2p(y).toFixed(trigger_level_xdecimal_places);
    $('#trigger_tooltip').tooltip('show');
  }

  function mouseUpOut(evt) {
    if(trig_dragging) {
      trig_dragging = false;

      var y;
      if(evt.type.indexOf('touch') > -1) {
        //y = evt.originalEvent.touches[0].clientY - this.getBoundingClientRect().top - plot.getPlotOffset().top;
        y = touch_last_y;
      }
      else {
        y = evt.clientY - this.getBoundingClientRect().top - plot.getPlotOffset().top;
      }

      var scale = (params.local.trig_source == 0 ? params.local.scale_ch1 : params.local.scale_ch2);
      params.local.trig_level = parseFloat(plot.getAxes().yaxis.c2p(y).toFixed(trigger_level_xdecimal_places)) / scale;

      updateTriggerSlider();
      redrawPlot();
      sendParams();
    }
    else {
      user_editing = false;
    }
    $('#trigger_tooltip').tooltip('hide');
  }

  function updateTriggerSlider(y, update_input) {
    if(! plot) {
      return;
    }

    var canvas = $('#trigger_canvas')[0];
    var context = canvas.getContext('2d');
    var plot_offset = plot.getPlotOffset();
    var ymax = params.original.gui_reset_y_range / 2;
    var ymin = ymax * -1;

    // Transform trigger level to real values
    // TODO: local or original params?
    var scale = (params.local.trig_source == 0 ? params.local.scale_ch1 : params.local.scale_ch2);
    var tlev = params.local.trig_level * scale;

    // If trigger level is outside the predefined ymin/ymax, change the level

    if(tlev < ymin) {
      tlev = ymin;
    }
    else if(tlev > ymax) {
      tlev = ymax;
    }

    if(y === undefined) {
      if(update_input !== false) {
        $('#trig_level').not(':focus').val(floatToLocalString(tlev));
      }
      y = plot.getAxes().yaxis.p2c(tlev);
    }

    // If trigger source is External or mode is not Normal or trigger level is not in visible area, do not show the trigger slider and paint the vertical line with gray
    context.clearRect(0, 0, canvas.width, canvas.height);
    var yaxis = plot.getAxes().yaxis;
    if(params.original.trig_mode != 1 || tlev < yaxis.min || tlev > yaxis.max || params.original.trig_source == 2) {
      context.lineWidth = 1;
      context.strokeStyle = '#dddddd';
      context.stroke();
      context.beginPath();
      context.moveTo(10, plot_offset.top);
      context.lineTo(10, canvas.height - plot_offset.bottom + 1);
      context.stroke();
    }
    else {
      context.beginPath();
      context.arc(10, y + plot_offset.top, 8, 0, 2 * Math.PI, false);
      context.fillStyle = '#009900';
      context.fill();
      context.lineWidth = 1;
      context.strokeStyle = '#007700';
      context.stroke();
      context.beginPath();
      context.moveTo(10, plot_offset.top);
      context.lineTo(10, canvas.height - plot_offset.bottom + 1);
      context.stroke();
    }
    $('#trigger_tooltip').css({ top: y + plot_offset.top });
  }

  function updateRanges() {
    var xunit = (params.local.time_units == 0 ? 'μs' : (params.local.time_units == 1 ? 'ms' : 's'));
    var yunit = 'V';
    var axes = plot.getAxes();
    var xrange = axes.xaxis.max - axes.xaxis.min;
    var yrange = axes.yaxis.max - axes.yaxis.min;
    var yminrange = 5e-3;  // Volts
    var ymaxrange = params.original.gui_reset_y_range;
    var xmaxrange = 10.0;  // seconds
    var xminrange = 20e-9; // seconds
    var decimals = 0;

    if(xunit == 'μs' && xrange < 1) {
      xrange *= 1000;
      xunit = 'ns';
    }
    if(xrange < 1) {
      decimals = 1;
    }
    var seconds = (xunit == 'ns' ? 1e-9 : ( xunit == 'μs' ? 1e-6 : (xunit == 'ms' ? 1e-3 : 1)));

    if(yrange < 1) {
      yunit = 'mV';
      yrange *= 1000;
      ymaxrange *= 1000;
      yminrange *= 1000;
    }

    $('#range_x').html(+(Math.round(xrange + "e+" + decimals) + "e-" + decimals) + ' ' + xunit);
    $('#range_y').html(Math.floor(yrange) + ' ' + yunit);

    var nearest_x = getNearestRanges(xrange);
    var nearest_y = getNearestRanges(yrange);

    // X limitations
    if(nearest_x.next * seconds > xmaxrange) {
      nearest_x.next = null;
      $('#range_x_plus').prop('disabled', true);
    }
    else {
      $('#range_x_plus').prop('disabled', false);
    }
    if(nearest_x.prev * seconds < xminrange) {
      nearest_x.prev = null;
      $('#range_x_minus').prop('disabled', true);
    }
    else {
      $('#range_x_minus').prop('disabled', false);
    }

    $('#range_x_minus').data({ nearest: nearest_x.prev, unit: xunit }).data('bs.tooltip').options.title = nearest_x.prev;
    $('#range_x_plus').data({ nearest: nearest_x.next, unit: xunit }).data('bs.tooltip').options.title = nearest_x.next;

    // Y limitations
    if(nearest_y.next - nearest_y.prev >= ymaxrange) {
      nearest_y.next = null;
      $('#range_y_plus').prop('disabled', true);
    }
    else {
      $('#range_y_plus').prop('disabled', false);
    }
    if(nearest_y.prev < yminrange) {
      nearest_y.prev = null;
      $('#range_y_minus').prop('disabled', true);
    }
    else {
      $('#range_y_minus').prop('disabled', false);
    }

    $('#range_y_minus').data({ nearest: nearest_y.prev, unit: yunit }).data('bs.tooltip').options.title = nearest_y.prev;
    $('#range_y_plus').data({ nearest: nearest_y.next, unit: yunit }).data('bs.tooltip').options.title = nearest_y.next;
  }

  function getNearestRanges(number) {
    var log10 = Math.floor(Math.log(number) / Math.LN10);
    var normalized = number / Math.pow(10, log10);
    var i = 0;
    var prev = null;
    var next = null;

    while(i < range_steps.length - 1) {
      var ratio = range_steps[i+1] / normalized;
      if(ratio > 0.99 && ratio < 1.01) {
        prev = range_steps[i];
        next = range_steps[i+2];
        break;
      }
      if(range_steps[i] < normalized && normalized < range_steps[i+1]) {
        prev = range_steps[i];
        next = range_steps[i+1];
        break;
      }
      i++;
    }

    return {
      prev: prev * Math.pow(10, log10),
      next: next * Math.pow(10, log10)
    };
  }

  function serverAutoScale() {
    params.local.auto_flag = 1;
    sendParams(true);
  }

  function postGenSingle(channel) {
    if(params.local['gen_trig_mod_ch' + channel] == 1) {
      params.local['gen_single_ch' + channel] = 1;
      sendParams();
    }
    else {
      $('#gen_ch' + channel + '_single').prop('disabled', true);
    }
    return false;
  }

  function showUploadForm(channel) {
    var file_elem = $('#uploaded_file');
    var fcontent_elem = $('#uploaded_file_content');
    var hint_elem = $('#upload_form .help-block');

    fcontent_elem.val('');
    hint_elem.html('Select the CSV file to upload.');
    $('#upload_form')[0].reset();
    $('#modal_upload_label span').text(channel);

    if(file_elem[0].files === undefined) {
      file_elem.hide().parent().addClass('has-error');
      hint_elem.html('Your browser is too old and do not support this feature.');
    }
    else {
      file_elem.show().parent().removeClass('has-error');
      file_elem.off('change').on('change', function() {
        var file = this.files[0];
        var freader = new FileReader();

        // File validation
        //var size = file.size;
        var type = file.type;
        if(file.type !== 'text/csv' && file.type !== 'text/comma-separated-values' && file.type !== 'application/vnd.ms-excel') {
          file_elem.parent().addClass('has-error');
          hint_elem.html('Wrong file type: ' + file.type);
          $('#upload_form')[0].reset();
        }
        else {
          file_elem.parent().removeClass('has-error');
          hint_elem.html('File size: ' + file.size + ' bytes');
          freader.onload = function(data) {
            fcontent_elem.val(this.result);
          };
          freader.readAsText(file);
        }
      });
    }

    $('#modal_upload').modal('show');

    return false;
  }

  function startUpload() {
    var mbody = $('#modal_upload .modal-body');
    var file_elem = $('#uploaded_file');
    var hint_elem = $('#upload_form .help-block');
    var channel = $('#modal_upload_label span').text();

    if(mbody.data('errtimer')) {
      clearTimeout(mbody.data('errtimer'));
      mbody.removeData('errtimer');
    }

    if(! $('#uploaded_file').val().length) {
      mbody.addClass('alert-danger').data('errtimer', setTimeout(function() {
        $('#modal_upload .modal-body').removeClass('alert-danger');
      }, 1000));
      return;
    }

    file_elem.hide();
    hint_elem.html('Uploading file...');

    $.post(upload_url + channel, $('#uploaded_file_content').val(), function(dresult) {
      if($.type(dresult) == 'string' && dresult.trim() == 'OK') {
        $('#upload_form')[0].reset();
        $('#modal_upload').modal('hide');

        user_editing = true;
        params.local.gen_awg_refresh = parseInt(channel);
        sendParams();
      }
      else {
        file_elem.show();
        hint_elem.html('Error while uploading the file.');
        file_elem.parent().addClass('has-error');
      }
    })
    .fail(function() {
      file_elem.show();
      hint_elem.html('Error while uploading the selected file.');
      file_elem.parent().addClass('has-error');
    });
  }

  function getLocalDecimalSeparator() {
    var n = 1.1;
    return n.toLocaleString().substring(1,2);
  }

  function parseLocalFloat(num) {
    return +(num.replace(getLocalDecimalSeparator(), '.'));
  }

  function floatToLocalString(num) {
    // Workaround for a bug in Safari 6 (reference: https://github.com/mleibman/SlickGrid/pull/472)
    //return num.toString().replace('.', getLocalDecimalSeparator());
    return (num + '').replace('.', getLocalDecimalSeparator());
  }

  function shortenFloat(value) {
    return value.toFixed(Math.abs(value) >= 10 ? 1 : 3);
  }

  function convertHz(value) {
    var unit = '';
    var decsep = getLocalDecimalSeparator();

    if(value >= 1e6) {
      value /= 1e6;
      unit = '<span class="unit">MHz</span>';
    }
    else if(value >= 1e3) {
      value /= 1e3;
      unit = '<span class="unit">kHz</span>';
    }
    else {
      unit = '<span class="unit">Hz</span>';
    }

    // Fix to 4 decimal digits in total regardless of the decimal point placement
    var eps = 1e-2;
    if (value >= 100 - eps) {
      value = value.toFixed(1);
    }
    else if  (value >= 10 - eps) {
      value = value.toFixed(2);
    }
    else {
      value = value.toFixed(3);
    }

    value = (value == 0 ? '---' + decsep + '-' : floatToLocalString(value));
    return value + unit;
  }

  function convertSec(value) {
    var unit = '';
    var decsep = getLocalDecimalSeparator();

    if(value < 1e-6) {
      value *= 1e9;
      unit = '<span class="unit">ns</span>';
    }
    else if(value < 1e-3) {
      value *= 1e6;
      unit = '<span class="unit">μs</span>';
    }
    else if(value < 1) {
      value *= 1e3
      unit = '<span class="unit">ms</span>';
    }
    else {
      unit = '<span class="unit">s</span>';
    }

    // Fix to 4 decimal digits in total regardless of the decimal point placement
    var eps = 1e-2;
    if (value >= 100 - eps) {
      value = value.toFixed(1);
    }
    else if  (value >= 10 - eps) {
      value = value.toFixed(2);
    }
    else {
      value = value.toFixed(3);
    }

    value = (value == 0 ? '---' + decsep + '-' : floatToLocalString(value));
    return value + unit;
  }

  // Functions for params load/save

  function config_save_storage(name){
    // check support and if there are saved configs
    if (typeof(Storage) == "undefined") {
        console.log("config_save_storage: No HTML5 Local storage");
        return -1;
    }

    // If thera are saved configs, load. If not, create empty container
    if ( localStorage.lockConfig ){
      params.storage=JSON.parse(localStorage.lockConfig);
    } else {
      params.storage=[];
    }

    // check if name is repeated
    for(i in params.storage){
      if(name==params.storage[i].name) {
        console.log('config_save_storage: Storage name repeated - ' + params.storage[i].name ) ;
        alert("Error: Storage name repeated");
        return -1;
      }
    }

    // create new element
    var tmp_storage_elem = {'name':name , 'datetime':new Date().toJSON(), 'data':{} };
    for(i in config_params_keys){
      if(params.local[ config_params_keys[i] ]!= null )
        tmp_storage_elem.data[ config_params_keys[i] ] = params.local[ config_params_keys[i] ];
    }

    // store element in params storage
    params.storage.push(tmp_storage_elem);

    // update storage key
    localStorage.lockConfig=JSON.stringify(params.storage);

  }

  function config_load_storage(name){
    // check support
    if (typeof(Storage) == "undefined") {
      console.log("config_load_storage: No HTML5 Local storage");
      return -1;
    }

    // If there are saved configs, load. If not, create empty container
    if ( localStorage.lockConfig ){
      params.storage=JSON.parse(localStorage.lockConfig);
    } else {
      params.storage=[];
      console.log("config_load_storage: No data saved in storage");
      return -1;
    }


    // check if name / num exist
    var num=-1;
    if(typeof(name)=="number") { // if it is a number ...
      if(name<params.storage.length) num=name;
    } else if (typeof(name)=="string"){ // if it is a string
      num = params.storage.findIndex( function (obj){ return obj.name == name  } ) ;
    }

    if(num<0) {
      console.log("config_load_storage: Saved name/num not found");
      return -1 ;
    }

    // Load actual data to skip loadParams errors
    meas_keys="meas_min_ch1,meas_max_ch1,meas_amp_ch1,meas_avg_ch1,meas_freq_ch1,meas_per_ch1,meas_min_ch2,meas_max_ch2,meas_amp_ch2,meas_avg_ch2,meas_freq_ch2,meas_per_ch2".split(",");
    for(i in meas_keys){
      params.storage[num].data[ meas_keys[i] ] = params.local[ meas_keys[i] ]
    }

    /* LOLO load_config_block_start */
    // If config_load_storage option is on, turn off Ramp and PIDs
    if(load_config_block_start==1){
      params.storage[num].data['lock_ctrl_aux_ramp_enable_ctrl']   = 0 ;
      params.storage[num].data['lock_ctrl_aux_pidA_enable_ctrl']   = 0 ;
      params.storage[num].data['lock_ctrl_aux_pidB_enable_ctrl']   = 0 ;
    }
    // */
    user_editing = true;
    //sending = true;

    // load into params
    loadParams(params.storage[num].data);

    // update params to server
    sendParams(true, true);

  }

  function config_del_storage(name){
    // check support
    if (typeof(Storage) == "undefined") {
      console.log("config_del_storage: No HTML5 Local storage");
      return -1;
    }

    // If there are saved configs, load. If not, create empty container
    if ( localStorage.lockConfig ){
      params.storage=JSON.parse(localStorage.lockConfig);
    } else {
      params.storage=[];
      console.log("config_del_storage: No data saved in storage");
      return -1;
    }


    // check if name / num exist
    var num=-1;
    if(typeof(name)=="number") { // if it is a number ...
      if(name<params.storage.length) num=name;
    } else if (typeof(name)=="string"){ // if it is a string
      num = params.storage.findIndex( function (obj){ return obj.name == name  } ) ;
    }

    if(num<0) {
      console.log("config_load_storage: Saved name/num not found");
      return -1 ;
    }


    // del config from params.storage
    params.storage.splice(num, 1);

    // update storage key
    localStorage.lockConfig=JSON.stringify(params.storage);
  }


  function config_show_storage(){
    // check support
    if (typeof(Storage) == "undefined") {
      console.log("config_load_storage: No HTML5 Local storage");
      return -1;
    }

    // If there are saved configs, load. If not, create empty container
    if ( localStorage.lockConfig ){
      params.storage=JSON.parse(localStorage.lockConfig);
    } else {
      params.storage=[];
      console.log("config_load_storage: No data saved in storage");
      return -1;
    }

    var txt='<table class="table text-left">';
    txt += '<thead><tr><th>Number</th><th>Name</th><th>DateTime</th><th colspan="3">Actions</th></tr></thead>';
    txt += '<tbody>';
    for(i in params.storage){
      txt += '<tr>';
      txt += '<td>' + $("<div />").text( i ).html() + '</td>';
      txt += '<td>' + $("<div />").text( params.storage[i].name ).html().replace('_','_<wbr>') + '</td>';
      txt += '<td>' +  pretty_now(params.storage[i].datetime).replace(' ','<br>')  + '</td>';
      txt += '<td>' + '<button onclick="config_del_storage('+i+');config_show_storage();" class="btn btn-primary btn-sm"  >del  </button>' + '</td>';
      txt += '<td>' + '<a id="btn_save_config_file_'+i+'" class="btn btn-primary btn-sm" >download</a>' + '</td>';
      txt += '<td>' + '<button onclick="config_load_storage('+i+'); $(\'#btn_close_config\').click();" class="btn btn-primary btn-sm" >load</button>' + '</td>';
      txt += '</tr>';
    }
    txt += '</tbody></table>';

    $("#config_storage_table").html(txt);
    var save_text = "";
    for(i in params.storage){
      save_text = JSON.stringify(params.storage[i]);
      $('#btn_save_config_file_'+i)[0].download = params.storage[i].name + ".json";
      $('#btn_save_config_file_'+i)[0].href     = "data:text/text;charset=utf-8," + encodeURIComponent(save_text);
    }
  }


  function config_save_file(){
    // Save name
    var name = $("#config_name_input").val();
    var filename_config = name + ".json";

    // create new element
    var tmp_storage_elem = {'name':name , 'datetime':new Date().toJSON(), 'data':{} };
    for(i in config_params_keys){
      if(params.local[ config_params_keys[i] ]!= null )
        tmp_storage_elem.data[ config_params_keys[i] ] = params.local[ config_params_keys[i] ];
    }

    var save_text = JSON.stringify(tmp_storage_elem);
    $('#btn_config_save_file')[0].download = filename_config;
    $('#btn_config_save_file')[0].href     = "data:text/text;charset=utf-8," + encodeURIComponent(save_text);

  }

  function config_load_file(evt){
    var files = evt.target.files[0]; // FileList object

    var reader = new FileReader();

    reader.onload = function(e) {
      var text = reader.result;


      // If thera are saved configs, load. If not, create empty container
      if ( localStorage.lockConfig ){
        params.storage=JSON.parse(localStorage.lockConfig);
      } else {
        params.storage=[];
      }

      // create new element
      var tmp_storage_elem = JSON.parse(text);

      // check if name is repeated
      for(i in params.storage){
        if(tmp_storage_elem.name==params.storage[i].name) {
          console.log('config_save_storage: Storage name repeated - ' + params.storage[i].name ) ;
          return -1;
        }
      }

      // store element in params storage
      params.storage.push(tmp_storage_elem);

      // update storage key
      localStorage.lockConfig=JSON.stringify(params.storage);

      // update config table
      config_show_storage();

    }

    reader.readAsText(files);

  }

  function now(dd){
    var dd = dd || new Date().toJSON() ;
    var date = new Date(dd);
    var date_str= ('0'+date.getFullYear()).substr(-4,4)+
                  ('0'+date.getMonth()+1 ).substr(-2,2)+
                  ('0'+date.getDate()    ).substr(-2,2)+
                  '_'+
                  ('0'+date.getHours()   ).substr(-2,2)+
                  ('0'+date.getMinutes() ).substr(-2,2)+
                  ('0'+date.getSeconds() ).substr(-2,2) ;
    return date_str;
  }

  function pretty_now(dd){
    var dd = dd || new Date().toJSON() ;
    var date = new Date(dd);
    var date_str= ('0'+date.getFullYear()).substr(-4,4)+'-'+
                  ('0'+date.getMonth()+1 ).substr(-2,2)+'-'+
                  ('0'+date.getDate()    ).substr(-2,2)+
                  ' '+
                  ('0'+date.getHours()   ).substr(-2,2)+':'+
                  ('0'+date.getMinutes() ).substr(-2,2)+':'+
                  ('0'+date.getSeconds() ).substr(-2,2) ;
    return date_str;
  }

