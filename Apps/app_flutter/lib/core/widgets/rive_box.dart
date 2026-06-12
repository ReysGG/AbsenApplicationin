import 'package:flutter/material.dart';
import 'package:rive/rive.dart';

/// Thin, crash-safe wrapper around a bundled `.riv` asset.
///
/// Bundled assets live in `assets/anim/`:
///   - little_machine.riv  — playful looping machine (loader / hero accent)
///   - vehicles.riv         — looping vehicle scene
///   - button.riv           — liquid button-ish interaction
///   - check.riv            — scene used for success/celebration
///
/// We autoplay the default artboard/animation so we don't depend on knowing a
/// specific state-machine name. If [stateMachine] is provided we attach it and
/// (optionally) flip a boolean input via [activeInput]. On any failure the
/// widget renders [fallback] (or empty) instead of crashing.
class RiveBox extends StatefulWidget {
  const RiveBox(
    this.asset, {
    super.key,
    this.size,
    this.fit = BoxFit.contain,
    this.stateMachine,
    this.activeInput,
    this.active = true,
    this.fallback,
  });

  final String asset;
  final double? size;
  final BoxFit fit;

  /// Optional state-machine name. If null, the default animation autoplays.
  final String? stateMachine;

  /// Optional boolean input name on the state machine to drive.
  final String? activeInput;
  final bool active;

  final Widget? fallback;

  static const littleMachine = 'assets/anim/little_machine.riv';
  static const vehicles = 'assets/anim/vehicles.riv';
  static const button = 'assets/anim/button.riv';
  static const check = 'assets/anim/check.riv';

  @override
  State<RiveBox> createState() => _RiveBoxState();
}

class _RiveBoxState extends State<RiveBox> {
  StateMachineController? _controller;
  SMIBool? _activeBool;
  final bool _failed = false;

  void _onInit(Artboard artboard) {
    final smName = widget.stateMachine;
    if (smName == null) return;
    try {
      final ctrl = StateMachineController.fromArtboard(artboard, smName);
      if (ctrl != null) {
        artboard.addController(ctrl);
        _controller = ctrl;
        if (widget.activeInput != null) {
          _activeBool = ctrl.findInput<bool>(widget.activeInput!) as SMIBool?;
          _activeBool?.value = widget.active;
        }
      }
    } catch (_) {
      // Leave default autoplay running.
    }
  }

  @override
  void didUpdateWidget(covariant RiveBox old) {
    super.didUpdateWidget(old);
    if (old.active != widget.active) {
      _activeBool?.value = widget.active;
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_failed) {
      return SizedBox(
        width: widget.size,
        height: widget.size,
        child: widget.fallback,
      );
    }

    Widget anim = RiveAnimation.asset(
      widget.asset,
      fit: widget.fit,
      onInit: widget.stateMachine != null ? _onInit : null,
    );

    if (widget.size != null) {
      anim = SizedBox(width: widget.size, height: widget.size, child: anim);
    }
    return anim;
  }
}
