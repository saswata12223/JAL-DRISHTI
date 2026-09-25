# RIVERMAMBA WSL2 FEASIBILITY AUDIT

## 1. Current Windows Hardware
- **CPU**: AMD Ryzen 7 250 w/ Radeon 780M Graphics (8 Cores, 16 Logical Processors)
- **RAM**: 32.8 GB Total / 13.6 GB Free
- **GPU**: NVIDIA GeForce RTX 5050 (8 GB VRAM, Driver 595.97, CUDA 13.2)
- **Disk C:**: 151.77 GB Free (Host for WSL virtual disk)

## 2. WSL2 Status
- **WSL version**: 2.6.3.0
- **Kernel version**: 6.6.87.2-1
- **Default Distribution**: Ubuntu
- **Python**: Python 3.12.3

## 3. GPU Status
- **Windows NVIDIA GPU**: NVIDIA GeForce RTX 5050
- **Windows driver**: 595.97
- **WSL GPU support**: YES. `nvidia-smi` executes successfully inside WSL.
- **CUDA visibility**: YES (CUDA 13.2 driver recognized inside WSL).
- **Expected WSL CUDA support**: Full compute support, given the matching driver.

## 4. RiverMamba Dependency Requirements
Derived from official `requirements.txt` and repository files:
- OS: Linux
- Python: Compatible with >= 3.8 (Tested with 3.12.3)
- PyTorch: `2.4.1+cu121`
- CUDA Toolkit: 12.1 (Needed for source compilation of specific dependencies)
- Triton: `3.0.0`
- mamba-ssm: `2.2.4`
- flash-attn: `2.7.0.post2`

## 5. Compatibility Matrix
| Component  | RiverMamba requirement | Local/WSL status | Compatible? |
| ---------- | ---------------------- | ---------------- | ----------- |
| OS         | Linux                  | Ubuntu via WSL2  | YES         |
| Python     | Python 3.x             | 3.12.3           | YES         |
| PyTorch    | `2.4.1+cu121`          | Target install   | YES         |
| CUDA       | 12.1 for builds        | Driver 13.2      | YES (requires manual CUDA toolkit install) |
| Triton     | `3.0.0`                | Target install   | YES (Linux wheel exists) |
| mamba-ssm  | `2.2.4`                | Target install   | YES (requires compilation/GitHub wheels) |
| flash-attn | `2.7.0.post2`          | Target install   | YES (requires compilation/GitHub wheels) |

## 6. Resource Requirements
- **Checkpoint size**: Unknown (Not explicitly detailed in repository without extracting the 7z archives)
- **Model parameter count**: Unknown
- **Expected VRAM**: Unknown (Depends heavily on AIFAS vs full map `n_points` setting)
- **Expected RAM**: Unknown
- **Expected inference time**: Unknown
- **Expected preprocessing time**: Unknown

## 7. Risks
- Compiling `flash-attn` and `mamba-ssm` from source in WSL requires `nvcc` and the correct GCC toolchain to match PyTorch 2.4.1 (`cu121`). This process is notoriously brittle.
- VRAM limitations: An 8GB RTX 5050 might bottleneck full-map inference (`n_points = 6221926`). AIFAS points inference (`254945`) is more likely to fit in 8GB VRAM.

## 8. Manual Actions Required
- Install standard build-essentials in Ubuntu (`sudo apt install build-essential`).
- Install CUDA Toolkit 12.1 inside Ubuntu via NVIDIA's developer repository to provide `nvcc` for compilation.
- Install PyTorch `2.4.1+cu121`.
- Install `triton==3.0.0` directly via `pip`.
- Install `flash-attn==2.7.0.post2` and `mamba-ssm==2.2.4` via precompiled GitHub wheels (if available for Python 3.12 / cu121) or compile from source.

## 9. Final Feasibility Status
**CONDITIONALLY FEASIBLE**

WSL2 is available, properly configured, and has direct access to the NVIDIA RTX 5050 GPU with working drivers. The model dependencies can be installed in this Linux environment, provided the CUDA 12.1 toolkit is manually installed to facilitate compiling the required C++/CUDA extensions (`mamba-ssm` and `flash-attn`).
