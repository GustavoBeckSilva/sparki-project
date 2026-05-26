from pathlib import Path

Import("env")


def patch_vespa_motors(*_args, **_kwargs):
    env_name = env["PIOENV"]
    project_dir = Path(env["PROJECT_DIR"])
    vespa_src = project_dir / ".pio" / "libdeps" / env_name / "RoboCore - Vespa" / "src"
    target = vespa_src / "VespaMotors.cpp"
    header = vespa_src / "RoboCore_Vespa.h"

    if header.exists():
        header_source = header.read_text()
        header_patched = header_source.replace(
            "#define VESPA_MOTORS_CHANNEL_A (14)\n#define VESPA_MOTORS_CHANNEL_B (15)",
            "#define VESPA_MOTORS_CHANNEL_A (0)\n#define VESPA_MOTORS_CHANNEL_B (1)",
        )
        if header_patched != header_source:
            header.write_text(header_patched)
            print("Patched RoboCore Vespa motor LEDC channels.")

    if not target.exists():
        return

    source = target.read_text()
    original = source

    replacements = {
        "ledcDetach(*this->_active_pin_A);\n      digitalWrite(*this->_active_pin_A, LOW);":
            "ledcDetach(*this->_active_pin_A);\n      pinMode(*this->_active_pin_A, OUTPUT);\n      digitalWrite(*this->_active_pin_A, LOW);",
        "this->_active_pin_A = pin;\n    //res = ledcAttach(*this->_active_pin_A, this->_pwm_frequency, this->_pwm_resolution);":
            "this->_active_pin_A = pin;\n    pinMode(*this->_active_pin_A, OUTPUT);\n    //res = ledcAttach(*this->_active_pin_A, this->_pwm_frequency, this->_pwm_resolution);",
        "ledcDetach(*this->_active_pin_B);\n      digitalWrite(*this->_active_pin_B, LOW);":
            "ledcDetach(*this->_active_pin_B);\n      pinMode(*this->_active_pin_B, OUTPUT);\n      digitalWrite(*this->_active_pin_B, LOW);",
        "this->_active_pin_B = pin;\n    //res = ledcAttach(*this->_active_pin_B, this->_pwm_frequency, this->_pwm_resolution);":
            "this->_active_pin_B = pin;\n    pinMode(*this->_active_pin_B, OUTPUT);\n    //res = ledcAttach(*this->_active_pin_B, this->_pwm_frequency, this->_pwm_resolution);",
    }

    for before, after in replacements.items():
        source = source.replace(before, after)

    if source != original:
        target.write_text(source)
        print("Patched RoboCore Vespa motor GPIO reconfiguration.")


patch_vespa_motors()
