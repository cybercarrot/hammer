import axios from 'axios';

// QR码生成接口返回的数据格式
export interface QRCodeResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    url: string;
    qrcode_key: string;
  };
}

// QR码扫描状态接口返回的数据格式
export interface QRCodePollResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    url: string;
    refresh_token: string;
    timestamp: number;
    code: number;
    message: string;
  };
}

// 用户基本信息接口
export interface UserInfoResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    isLogin: boolean; // 是否登录
    email_verified: number;
    face: string; // 头像URL
    face_nft: number;
    face_nft_type: number;
    level_info: {
      current_level: number;
      current_min: number;
      current_exp: number;
      next_exp: string;
    };
    mid: number; // 用户ID
    mobile_verified: number;
    money: number; // 硬币数
    moral: number;
    official: {
      role: number;
      title: string;
      desc: string;
      type: number;
    };
    officialVerify: {
      type: number;
      desc: string;
    };
    pendant: {
      pid: number;
      name: string;
      image: string;
      expire: number;
      image_enhance: string;
      image_enhance_frame: string;
      n_pid: number;
    };
    scores: number;
    uname: string; // 用户名
    vipDueDate: number;
    vipStatus: number;
    vipType: number;
    vip_pay_type: number;
    vip_theme_type: number;
    vip_label: {
      path: string;
      text: string;
      label_theme: string;
      text_color: string;
      bg_style: number;
      bg_color: string;
      border_color: string;
      use_img_label: boolean;
      img_label_uri_hans: string;
      img_label_uri_hant: string;
      img_label_uri_hans_static: string;
      img_label_uri_hant_static: string;
    };
    vip_avatar_subscript: number;
    vip_nickname_color: string;
    vip: {
      type: number;
      status: number;
      due_date: number;
      vip_pay_type: number;
      theme_type: number;
      label: {
        path: string;
        text: string;
        label_theme: string;
        text_color: string;
        bg_style: number;
        bg_color: string;
        border_color: string;
        use_img_label: boolean;
        img_label_uri_hans: string;
        img_label_uri_hant: string;
        img_label_uri_hans_static: string;
        img_label_uri_hant_static: string;
      };
      avatar_subscript: number;
      nickname_color: string;
      role: number;
      avatar_subscript_url: string;
      tv_vip_status: number;
      tv_vip_pay_type: number;
      tv_due_date: number;
      avatar_icon: {
        icon_type: number;
        icon_resource: Record<string, unknown>;
      };
    };
    wallet: {
      mid: number;
      bcoin_balance: number;
      coupon_balance: number;
      coupon_due_time: number;
    };
    has_shop: boolean;
    shop_url: string;
    answer_status: number;
    is_senior_member: number;
    wbi_img: {
      img_url: string;
      sub_url: string;
    };
    is_jury: boolean;
    name_render: unknown;
  };
}

// 直播间信息接口
export interface LiveRoomInfoResponse {
  code: number;
  message: string;
  ttl: number;
  data: {
    room_id: number;
    uid: number;
    uname: string;
    face: string;
    cover: string;
    title: string;
    area_name: string;
    parent_area_name: string;
    keyframe: string;
    is_sp: number;
    special_type: number;
    broadcast_type: number;
    online: number;
  };
}

export class BilibiliService {
  // 生成QR码的API
  private static readonly QR_GENERATE_URL = 'https://passport.bilibili.com/x/passport-login/web/qrcode/generate';
  // 轮询QR码状态的API
  private static readonly QR_POLL_URL = 'https://passport.bilibili.com/x/passport-login/web/qrcode/poll';
  // 获取用户信息的API
  private static readonly USER_INFO_URL = 'https://api.bilibili.com/x/web-interface/nav';
  private static readonly LIVE_ROOM_INFO_URL = 'https://api.live.bilibili.com/live_user/v1/Master/info';

  /**
   * 生成登录二维码
   * @returns 返回QR码URL和key
   */
  public static async generateQRCode(): Promise<QRCodeResponse['data']> {
    try {
      const response = await axios.get<QRCodeResponse>(this.QR_GENERATE_URL);
      const data = response.data;

      if (data.code === 0 && data.data) {
        return data.data;
      } else {
        throw new Error(`获取二维码失败: ${data.message}`);
      }
    } catch (error) {
      console.error('获取QR码失败:', error);
      throw error;
    }
  }

  /**
   * 轮询QR码状态
   * @param qrcodeKey 二维码Key
   * @returns 返回扫码状态
   */
  public static async pollQRCodeStatus(qrcodeKey: string): Promise<QRCodePollResponse['data']> {
    try {
      // 注意：这里使用withCredentials以便接收和发送跨域cookie
      const response = await axios.get<QRCodePollResponse>(`${this.QR_POLL_URL}?qrcode_key=${qrcodeKey}`, {
        withCredentials: true,
      });
      const data = response.data;

      if (data.code === 0 && data.data) {
        // 如果登录成功，可能会有一些cookies返回
        if (data.data.code === 0) {
          // 浏览器会自动处理 Cookie
          console.log('登录成功，Cookie由浏览器自动处理');
        }
        return data.data;
      } else {
        throw new Error(`轮询二维码状态失败: ${data.message}`);
      }
    } catch (error) {
      console.error('轮询QR码状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取直播间信息
   * @param uid 用户ID
   * @returns 直播间信息
   */
  public static async getLiveRoomInfo(uid: number): Promise<LiveRoomInfoResponse['data']> {
    try {
      const config = { withCredentials: true };
      const response = await axios.get<LiveRoomInfoResponse>(`${this.LIVE_ROOM_INFO_URL}?uid=${uid}`, config);
      const data = response.data;

      if (data.code === 0 && data.data) {
        return data.data;
      } else {
        throw new Error(`获取直播间信息失败: ${data.message}`);
      }
    } catch (error) {
      console.error('获取直播间信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户信息
   * @returns 用户信息
   */
  public static async getUserInfo(): Promise<UserInfoResponse['data']> {
    try {
      // 使用withCredentials让浏览器自动发送cookie
      const config = { withCredentials: true };

      const response = await axios.get<UserInfoResponse>(this.USER_INFO_URL, config);
      const data = response.data;

      if (data.code === 0 && data.data) {
        return data.data;
      } else {
        throw new Error(`获取用户信息失败: ${data.message}`);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }
}
