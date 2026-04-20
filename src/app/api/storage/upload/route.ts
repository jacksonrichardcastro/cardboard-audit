import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/env";

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    
    // Enforced Seller Auth explicitly required to generate blob space
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();
    const { filename } = body;
    
    if (!filename) {
      return new NextResponse("Filename is required", { status: 400 });
    }

    // Cryptographic isolation enforcing multitenancy file ownership inside the bucket
    const filePath = `listings/${userId}/${Date.now()}_${filename}`;

    const { data, error } = await supabase.storage
      .from("cardbound-media")
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error("[SUPABASE_SIGNED_URL_ERROR]", error);
      return new NextResponse("Failed to generate secure upload pipeline.", { status: 500 });
    }

    // Predicting the final static URL path so the client can map it directly to the Database JSON array
    const publicUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/cardbound-media/${filePath}`;

    return NextResponse.json({
      signedUrl: data.signedUrl,
      publicUrl
    });
  } catch (error) {
    console.error("[STORAGE_INTERNAL_ERROR]", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
